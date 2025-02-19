import simpy
import random
import math
from dataclasses import dataclass
from typing import List, Dict

# Add these constants at the top of the file for base processing times and variability
PROCESS_TIMES = {
    'body': {'mean': 1.0, 'sigma': 0.2},  # 1 hour base time
    'neck': {'mean': 1.0, 'sigma': 0.2},  # 1 hour base time
    'paint': {'mean': 2.0, 'sigma': 0.3},  # 2 hours base time
    'assembly': {'mean': 1.0, 'sigma': 0.2}  # 1 hour base time
}

# Add these constants at the top with others
QUALITY_PARAMS = {
    'body': {'mean': 0.92, 'std': 0.05},  # 92% pass rate for body making
    'neck': {'mean': 0.92, 'std': 0.05},  # 92% pass rate for neck making
    'paint': {'mean': 0.85, 'std': 0.08},  # 85% pass rate for painting
    'assembly': {'mean': 0.98, 'std': 0.02}  # 98% pass rate for assembly
}

# Add to the top with other constants
SICK_DAY_PROBABILITY = 0.02  # 2% chance of calling out sick each day

def get_lognormal_time(process_type: str) -> float:
    """
    Generate a lognormally distributed processing time.
    Returns time in hours.
    """
    params = PROCESS_TIMES[process_type]
    # Convert mean and sigma to lognormal parameters
    phi = math.sqrt(params['sigma']**2 + params['mean']**2)
    mu = math.log(params['mean']**2 / phi)
    sigma = math.sqrt(math.log(phi**2 / params['mean']**2))
    
    return random.lognormvariate(mu, sigma)

def quality_check(process_type: str) -> bool:
    """
    Perform quality check using normal distribution.
    Returns True if quality check passes, False if it fails.
    """
    params = QUALITY_PARAMS[process_type]
    quality_score = random.gauss(params['mean'], params['std'])
    return quality_score >= 0.8  # Minimum acceptable quality score is 0.8

@dataclass
class SimulationResult:
    guitars_made: int
    logs: List[str]
    final_state: Dict
    financial_results: Dict

class Guitar_Factory:
    def __init__(self, env, params):
        self.hours_per_day = params['hours']
        self.logs = []
        self.guitars_made = 0
        self.wood = simpy.Container(env, capacity=params['wood_capacity'], init=params['initial_wood'])
        self.wood_control = env.process(self.wood_stock_control(env, params['wood_critical_stock']))
        self.electronic = simpy.Container(env, capacity=params['electronic_capacity'], init=params['initial_electronic'])
        self.electronic_control = env.process(self.electronic_stock_control(env))
        self.body_pre_paint = simpy.Container(env, capacity=params['body_pre_paint_capacity'], init=0)
        self.neck_pre_paint = simpy.Container(env, capacity=params['neck_pre_paint_capacity'], init=0)
        self.body_post_paint = simpy.Container(env, capacity=params['body_post_paint_capacity'], init=0)
        self.neck_post_paint = simpy.Container(env, capacity=params['neck_post_paint_capacity'], init=0)
        self.dispatch = simpy.Container(env, capacity=params['dispatch_capacity'], init=0)
        self.dispatch_control = env.process(self.dispatch_guitars_control(env))
        
        # Add financial parameters
        self.finances = {
            'total_revenue': 0,
            'labor_costs': 0,
            'material_costs': 0,
            'profit': 0
        }
        
        # Costs and prices
        self.costs = {
            'wood_per_unit': 50,  # $50 per wood unit
            'electronic_per_unit': 100,  # $100 per electronic unit
            'guitar_sale_price': 1000,  # $1000 per guitar
            'daily_fixed_costs': 2000, # $2000 per day fixed costs
            'hourly_wages': {
                'body_maker': 25,
                'neck_maker': 25,
                'painter': 30,
                'assembler': 28
            },
            'overtime_multiplier': 1.5  # 1.5x pay for overtime
        }

        # Add worker availability tracking
        self.available_workers = {
            'body_makers': [],
            'neck_makers': [],
            'painters': [],
            'assemblers': []
        }
        
        # Initialize all workers as available
        self.total_workers = {
            'body_makers': params['num_body'],
            'neck_makers': params['num_neck'],
            'painters': params['num_paint'],
            'assemblers': params['num_ensam']
        }
        
        # Start the worker availability process
        self.worker_control = env.process(self.update_worker_availability(env))

    def log(self, message):
        self.logs.append(message)

    def wood_stock_control(self, env, wood_critical_stock):
        yield env.timeout(0)
        while True:
            if self.wood.level <= wood_critical_stock:
                current_day = int(env.now/self.hours_per_day)
                current_hour = env.now % self.hours_per_day
                self.log(f'wood stock below critical level ({self.wood.level}) at day {current_day}, hour {current_hour}')
                self.log('calling wood supplier')
                self.log('----------------------------------')
                yield env.timeout(16)
                self.log('wood supplier arrives at day {0}, hour {1}'.format(
                    current_day, current_hour))
                yield self.wood.put(300)
                self.log('new wood stock is {0}'.format(
                    self.wood.level))
                self.log('----------------------------------')
                yield env.timeout(8)
            else:
                yield env.timeout(1)
    
    def electronic_stock_control(self, env):
        yield env.timeout(0)
        while True:
            if self.electronic.level <= 30:
                current_day = int(env.now/self.hours_per_day)
                current_hour = env.now % self.hours_per_day
                self.log(f'electronic stock below critical level ({self.electronic.level}) at day {current_day}, hour {current_hour}')
                self.log('calling electronic supplier')
                self.log('----------------------------------')
                yield env.timeout(9)
                self.log('electronic supplier arrives at day {0}, hour {1}'.format(
                    current_day, current_hour))
                yield self.electronic.put(30)
                self.log('new electronic stock is {0}'.format(
                    self.electronic.level))
                self.log('----------------------------------')
                yield env.timeout(8)
            else:
                yield env.timeout(1)
                
    def calculate_worker_pay(self, hours_worked, role):
        base_rate = self.costs['hourly_wages'][role]
        regular_hours = min(40, hours_worked)
        overtime_hours = max(0, hours_worked - 40)
        
        regular_pay = regular_hours * base_rate
        overtime_pay = overtime_hours * base_rate * self.costs['overtime_multiplier']
        
        return regular_pay + overtime_pay

    def dispatch_guitars_control(self, env):
        yield env.timeout(0)
        while True:
            if self.dispatch.level >= 50:
                current_day = int(env.now/self.hours_per_day)
                current_hour = env.now % self.hours_per_day
                self.log(f'dispatch stock is {self.dispatch.level}, calling store to pick guitars at day {current_day}, hour {current_hour}')
                self.log('----------------------------------')
                yield env.timeout(4)
                self.log(f'store picking {self.dispatch.level} guitars at day {current_day}, hour {current_hour}')
                
                # Calculate revenue from guitars
                guitars_sold = self.dispatch.level
                revenue = guitars_sold * self.costs['guitar_sale_price']
                self.finances['total_revenue'] += revenue
                self.log(f'Revenue from sale: ${revenue:,.2f}')
                
                self.guitars_made += self.dispatch.level
                yield self.dispatch.get(self.dispatch.level)
                self.log('----------------------------------')
                yield env.timeout(8)
            else:
                yield env.timeout(1)

    def update_worker_availability(self, env):
        """Updates worker availability at the start of each day"""
        while True:
            # Wait until start of next day
            next_day = (int(env.now / self.hours_per_day) + 1) * self.hours_per_day
            yield env.timeout(next_day - env.now)
            
            current_day = int(env.now/self.hours_per_day)
            self.log(f'Day {current_day} Worker Attendance:')
            # Reset available workers for new day
            self.available_workers = {
                'body_makers': [],
                'neck_makers': [],
                'painters': [],
                'assemblers': []
            }
            
            # Check each worker for attendance
            for worker_type, count in self.total_workers.items():
                for i in range(count):
                    if random.random() > SICK_DAY_PROBABILITY:
                        self.available_workers[worker_type].append(i)
                    else:
                        self.log(f'- {worker_type}: {i+1} called in sick')
            
            # Log total available workers
            for worker_type, available in self.available_workers.items():
                self.log(f'- {worker_type}: {len(available)}/{self.total_workers[worker_type]} workers present')
            self.log('----------------------------------')

def body_maker(env, factory, worker_id):
    while True:
        yield factory.wood.get(2)
        process_time = get_lognormal_time('body')
        factory.log(f'Body maker {worker_id+1} started, estimated time: {process_time:.2f} hours')
        yield env.timeout(process_time)

        if quality_check('body'):
            yield factory.body_pre_paint.put(1)
            factory.log(f'Body maker {worker_id+1} completed in {process_time:.2f} hours')
        else:
            factory.log(f'Body maker {worker_id+1} failed quality check - Materials scrapped')
            factory.finances['material_costs'] += 2 * factory.costs['wood_per_unit']

def neck_maker(env, factory, worker_id):
    while True:
        yield factory.wood.get(1)
        process_time = get_lognormal_time('neck')
        factory.log(f'Neck maker {worker_id+1} started, estimated time: {process_time:.2f} hours')
        yield env.timeout(process_time)

        if quality_check('neck'):
            yield factory.neck_pre_paint.put(1)
            factory.log(f'Neck maker {worker_id+1} completed in {process_time:.2f} hours')
        else:
            factory.log(f'Neck maker {worker_id+1} failed quality check - Materials scrapped')
            factory.finances['material_costs'] += factory.costs['wood_per_unit']

def painter(env, factory, worker_id):
    while True:
        if factory.body_pre_paint.level > 0 and factory.neck_pre_paint.level > 0:
            yield factory.body_pre_paint.get(1)
            yield factory.neck_pre_paint.get(1)
            process_time = get_lognormal_time('paint')
            factory.log(f'Painter {worker_id+1} started, estimated time: {process_time:.2f} hours')
            yield env.timeout(process_time)

            body_quality = quality_check('paint')
            neck_quality = quality_check('paint')

            if body_quality and neck_quality:
                yield factory.body_post_paint.put(1)
                yield factory.neck_post_paint.put(1)
                factory.log(f'Painter {worker_id+1} completed in {process_time:.2f} hours')
            else:
                if not body_quality:
                    yield factory.body_pre_paint.put(1)
                    factory.log(f'Painter {worker_id+1}: Body paint failed QC - Returning for repainting')
                else:
                    yield factory.body_post_paint.put(1)

                if not neck_quality:
                    yield factory.neck_pre_paint.put(1)
                    factory.log(f'Painter {worker_id+1}: Neck paint failed QC - Returning for repainting')
                else:
                    yield factory.neck_post_paint.put(1)
        else:
            yield env.timeout(0.1)

def assembler(env, factory, worker_id):
    while True:
        if factory.body_post_paint.level > 0 and factory.neck_post_paint.level > 0 and factory.electronic.level > 0:
            yield factory.body_post_paint.get(1)
            yield factory.neck_post_paint.get(1)
            yield factory.electronic.get(1)
            process_time = get_lognormal_time('assembly')
            factory.log(f'Assembler {worker_id+1} started, estimated time: {process_time:.2f} hours')
            yield env.timeout(process_time)

            if quality_check('assembly'):
                yield factory.dispatch.put(1)
                factory.log(f'Assembler {worker_id+1} completed in {process_time:.2f} hours')
            else:
                factory.log(f'Assembler {worker_id+1} failed quality check - Materials scrapped')
                factory.finances['material_costs'] += (
                    3 * factory.costs['wood_per_unit'] +
                    factory.costs['electronic_per_unit']
                )
        else:
            yield env.timeout(0.1)

class GuitarFactorySimulation:
    def __init__(self, hours=8, days=23, num_body=2, num_neck=1, num_paint=3, num_ensam=2):
        self.hours = hours
        self.days = days
        self.total_time = hours * days
        
        # Store all parameters as instance variables
        self.num_body = num_body
        self.num_neck = num_neck
        self.num_paint = num_paint
        self.num_ensam = num_ensam
        
        # Parameters
        self.params = {
            'wood_capacity': 500,
            'initial_wood': 200,
            'electronic_capacity': 100,
            'initial_electronic': 60,
            'body_pre_paint_capacity': 60,
            'neck_pre_paint_capacity': 60,
            'body_post_paint_capacity': 120,
            'neck_post_paint_capacity': 120,
            'dispatch_capacity': 500,
            'wood_critical_stock': ((8/1) * num_body + (8/1) * num_neck) * 3,
            'num_body': num_body,
            'num_neck': num_neck,
            'num_paint': num_paint,
            'num_ensam': num_ensam,
            'hours': hours
        }

    def run_simulation(self):
        env = simpy.Environment()
        self.guitar_factory = Guitar_Factory(env, self.params)

        # Modify process generators to only create processes for available workers
        def body_maker_gen(env, factory):
            while True:
                # Wait until start of day
                next_day = (int(env.now / self.params['hours']) + 1) * self.params['hours']
                yield env.timeout(next_day - env.now)
                
                # Start processes only for available workers
                for worker_id in factory.available_workers['body_makers']:
                    env.process(body_maker(env, factory, worker_id))

        def neck_maker_gen(env, factory):
            while True:
                next_day = (int(env.now / self.params['hours']) + 1) * self.params['hours']
                yield env.timeout(next_day - env.now)
                for worker_id in factory.available_workers['neck_makers']:
                    env.process(neck_maker(env, factory, worker_id))

        def painter_maker_gen(env, factory):
            while True:
                next_day = (int(env.now / self.params['hours']) + 1) * self.params['hours']
                yield env.timeout(next_day - env.now)
                for worker_id in factory.available_workers['painters']:
                    env.process(painter(env, factory, worker_id))

        def assembler_maker_gen(env, factory):
            while True:
                next_day = (int(env.now / self.params['hours']) + 1) * self.params['hours']
                yield env.timeout(next_day - env.now)
                for worker_id in factory.available_workers['assemblers']:
                    env.process(assembler(env, factory, worker_id))

        # Start processes
        env.process(body_maker_gen(env, self.guitar_factory))
        env.process(neck_maker_gen(env, self.guitar_factory))
        env.process(painter_maker_gen(env, self.guitar_factory))
        env.process(assembler_maker_gen(env, self.guitar_factory))

        # Run simulation
        env.run(until=self.total_time)

        final_state = {
            'body_pre_paint': self.guitar_factory.body_pre_paint.level,
            'neck_pre_paint': self.guitar_factory.neck_pre_paint.level,
            'body_post_paint': self.guitar_factory.body_post_paint.level,
            'neck_post_paint': self.guitar_factory.neck_post_paint.level,
            'dispatch': self.guitar_factory.dispatch.level,
            'total_guitars': self.guitar_factory.guitars_made + self.guitar_factory.dispatch.level
        }

        # Calculate final financial results
        weekly_hours = self.hours * 5  # Assuming 5-day work week
        total_weeks = self.days / 5

        # Calculate labor costs
        labor_costs = 0
        labor_costs += self.num_body * self.guitar_factory.calculate_worker_pay(weekly_hours * total_weeks, 'body_maker')
        labor_costs += self.num_neck * self.guitar_factory.calculate_worker_pay(weekly_hours * total_weeks, 'neck_maker')
        labor_costs += self.num_paint * self.guitar_factory.calculate_worker_pay(weekly_hours * total_weeks, 'painter')
        labor_costs += self.num_ensam * self.guitar_factory.calculate_worker_pay(weekly_hours * total_weeks, 'assembler')

        # Calculate material costs
        wood_used = (self.guitar_factory.guitars_made * 3)  # 2 for body + 1 for neck
        electronics_used = self.guitar_factory.guitars_made
        material_costs = (wood_used * self.guitar_factory.costs['wood_per_unit'] +
                        electronics_used * self.guitar_factory.costs['electronic_per_unit'])
        fixed_costs = self.guitar_factory.costs['daily_fixed_costs'] * self.days

        self.guitar_factory.finances['fixed_costs'] = fixed_costs
        self.guitar_factory.finances['labor_costs'] = labor_costs
        self.guitar_factory.finances['material_costs'] = material_costs
        self.guitar_factory.finances['profit'] = (self.guitar_factory.finances['total_revenue'] - 
                                                labor_costs - material_costs - fixed_costs)

        return SimulationResult(
            guitars_made=self.guitar_factory.guitars_made + self.guitar_factory.dispatch.level,
            logs=self.guitar_factory.logs,
            final_state=final_state,
            financial_results=self.guitar_factory.finances
        )

def run_factory_simulation(params: dict) -> SimulationResult:
    simulation = GuitarFactorySimulation(
        hours=params.get('hours', 8),
        days=params.get('days', 23),
        num_body=params.get('num_body', 2),
        num_neck=params.get('num_neck', 1),
        num_paint=params.get('num_paint', 3),
        num_ensam=params.get('num_ensam', 2)
    )
    return simulation.run_simulation()
