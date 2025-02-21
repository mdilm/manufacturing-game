import simpy
import random
import math
from dataclasses import dataclass
from typing import List, Dict

## GLOBAL CONSTANTS
# Set constant mean and variability for each processing time
PROCESS_TIMES = {
    'body': {'mean': 1.0, 'sigma': 0.2},  # 1 hour base time
    'neck': {'mean': 1.0, 'sigma': 0.2},  # 1 hour base time
    'paint': {'mean': 2.0, 'sigma': 0.3},  # 2 hours base time
    'assembly': {'mean': 1.0, 'sigma': 0.2}  # 1 hour base time
}

# Set constant mean and variability for each quality check
QUALITY_PARAMS = {
    'body': {'mean': 0.92, 'std': 0.05},  # 92% pass rate for body making
    'neck': {'mean': 0.92, 'std': 0.05},  # 92% pass rate for neck making
    'paint': {'mean': 0.85, 'std': 0.08},  # 85% pass rate for painting
    'assembly': {'mean': 0.98, 'std': 0.02}  # 98% pass rate for assembly
}

# Set constant probability of calling out sick each day
SICK_DAY_PROBABILITY = 0.05  # 5% chance of calling out sick each day

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

@dataclass
class WeeklyResult:
    guitars_made: int
    logs: List[str]
    final_state: Dict
    financial_results: Dict
    week_number: int
    remaining_demand: int
    overproduction: int
    demand_penalty: float

class Guitar_Factory:
    def __init__(self, env, params):
        self.params = params
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
        self.dispatch_threshold = params['dispatch_threshold']
        
        # Add idle time tracking
        self.idle_times = {
            'body_makers': 0,
            'neck_makers': 0,
            'painters': 0,
            'assemblers': 0
        }
        
        # Add idle costs to finances
        self.finances = {
            'total_revenue': 0,
            'labor_costs': 0,
            'material_costs': 0,
            'idle_costs': 0,
            'fixed_costs': 0,
            'profit': 0
        }
        
        # Costs and prices
        self.costs = {
            'wood_per_unit': 50,  # $50 per wood unit
            'electronic_per_unit': 100,  # $100 per electronic unit
            'guitar_sale_price': 800,  # $800 per guitar (increased from $600)
            'daily_fixed_costs': 2000, # $2000 per day fixed costs
            'dispatch_cost': 500,  # $500 per dispatch call
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
        
        # Initialize all workers
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
        """
        Function to control the wood stock.
        """
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
                
                # Use configured order size
                wood_purchase = self.params['wood_order_size']
                purchase_cost = wood_purchase * self.costs['wood_per_unit']
                self.finances['material_costs'] += purchase_cost
                self.log(f'Purchased {wood_purchase} wood units for ${purchase_cost:,.2f}')
                
                yield self.wood.put(wood_purchase)
                self.log('new wood stock is {0}'.format(
                    self.wood.level))
                self.log('----------------------------------')
                yield env.timeout(8)
            else:
                yield env.timeout(1)
    
    def electronic_stock_control(self, env):
        """
        Function to control the electronic stock.
        """
        yield env.timeout(0)
        while True:
            if self.electronic.level <= self.params['electronic_critical_level']:
                current_day = int(env.now/self.hours_per_day)
                current_hour = env.now % self.hours_per_day
                self.log(f'electronic stock below critical level ({self.electronic.level}) at day {current_day}, hour {current_hour}')
                self.log('calling electronic supplier')
                self.log('----------------------------------')
                yield env.timeout(9)
                self.log('electronic supplier arrives at day {0}, hour {1}'.format(
                    current_day, current_hour))
                
                # Use configured order size
                electronic_purchase = self.params['electronic_order_size']
                purchase_cost = electronic_purchase * self.costs['electronic_per_unit']
                self.finances['material_costs'] += purchase_cost
                self.log(f'Purchased {electronic_purchase} electronic units for ${purchase_cost:,.2f}')
                
                yield self.electronic.put(electronic_purchase)
                self.log('new electronic stock is {0}'.format(
                    self.electronic.level))
                self.log('----------------------------------')
                yield env.timeout(8)
            else:
                yield env.timeout(1)
                
    def calculate_worker_pay(self, hours_worked, role):
        """
        Function to calculate the pay for a worker.
        """
        base_rate = self.costs['hourly_wages'][role]
        regular_hours = min(40, hours_worked)
        overtime_hours = max(0, hours_worked - 40)
        
        regular_pay = regular_hours * base_rate
        overtime_pay = overtime_hours * base_rate * self.costs['overtime_multiplier']
        
        return regular_pay + overtime_pay

    def dispatch_guitars_control(self, env):
        """Function to control the dispatch of guitars."""
        yield env.timeout(0)
        while True:
            if self.dispatch.level >= self.dispatch_threshold:
                current_day = int(env.now/self.hours_per_day)
                current_hour = env.now % self.hours_per_day
                self.log(f'dispatch stock is {self.dispatch.level}, calling store to pick guitars at day {current_day}, hour {current_hour}')
                self.log('----------------------------------')
                yield env.timeout(4)
                self.log(f'store picking {self.dispatch.level} guitars at day {current_day}, hour {current_hour}')
                
                # Calculate revenue and dispatch cost
                guitars_sold = self.dispatch.level
                revenue = guitars_sold * self.costs['guitar_sale_price']
                self.finances['total_revenue'] += revenue
                self.finances['material_costs'] += self.costs['dispatch_cost']
                
                # Don't reset guitars_made, just add to it
                self.guitars_made += guitars_sold
                yield self.dispatch.get(self.dispatch.level)
                self.log('----------------------------------')
                yield env.timeout(8)
            else:
                yield env.timeout(1)

    def update_worker_availability(self, env):
        """
        Updates worker availability at the start of each day
        """
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
    """
    Function to make the body of the guitar.
    """
    while True:
        if factory.body_pre_paint.level >= factory.params['body_pre_paint_capacity'] - 5:
            # Worker is idle due to full storage
            idle_start = env.now
            factory.log(f'Body maker {worker_id+1} going idle - storage full')
            yield env.timeout(0.1)  # Check again in 6 minutes
            idle_time = env.now - idle_start
            factory.idle_times['body_makers'] += idle_time
            factory.finances['idle_costs'] += idle_time * factory.costs['hourly_wages']['body_maker']
            continue
            
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
    """
    Function to make the neck of the guitar.
    """
    while True:
        if factory.neck_pre_paint.level >= factory.params['neck_pre_paint_capacity'] - 5:
            idle_start = env.now
            factory.log(f'Neck maker {worker_id+1} going idle - storage full')
            yield env.timeout(0.1)
            idle_time = env.now - idle_start
            factory.idle_times['neck_makers'] += idle_time
            factory.finances['idle_costs'] += idle_time * factory.costs['hourly_wages']['neck_maker']
            continue
            
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
    """
    Function to paint the guitar.
    """
    while True:
        if (factory.body_post_paint.level >= factory.params['body_post_paint_capacity'] - 5 or
            factory.neck_post_paint.level >= factory.params['neck_post_paint_capacity'] - 5):
            idle_start = env.now
            factory.log(f'Painter {worker_id+1} going idle - storage full')
            yield env.timeout(0.1)
            idle_time = env.now - idle_start
            factory.idle_times['painters'] += idle_time
            factory.finances['idle_costs'] += idle_time * factory.costs['hourly_wages']['painter']
            continue
            
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
            idle_start = env.now
            yield env.timeout(0.1)
            idle_time = env.now - idle_start
            factory.idle_times['painters'] += idle_time
            factory.finances['idle_costs'] += idle_time * factory.costs['hourly_wages']['painter']

def assembler(env, factory, worker_id):
    """
    Function to assemble the guitar.
    """
    while True:
        if factory.dispatch.level >= factory.params['dispatch_capacity'] - 5:
            idle_start = env.now
            factory.log(f'Assembler {worker_id+1} going idle - dispatch full')
            yield env.timeout(0.1)
            idle_time = env.now - idle_start
            factory.idle_times['assemblers'] += idle_time
            factory.finances['idle_costs'] += idle_time * factory.costs['hourly_wages']['assembler']
            continue
            
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
            idle_start = env.now
            yield env.timeout(0.1)
            idle_time = env.now - idle_start
            factory.idle_times['assemblers'] += idle_time
            factory.finances['idle_costs'] += idle_time * factory.costs['hourly_wages']['assembler']

class GuitarFactorySimulation:
    def __init__(self, hours=8, days=5, num_body=2, num_neck=1, num_paint=3, num_ensam=2, 
                 dispatch_threshold=50, total_demand=200, current_week=1):
        self.hours = hours
        self.days = days  # Changed to 5 days per week
        self.total_time = hours * days
        self.total_demand = total_demand
        self.current_week = current_week
        self.weekly_demand = total_demand / 4  # Split demand over 4 weeks
        
        # Track weekly production
        self.total_production = 0
        self.weekly_production = 0
        
        # Store all parameters as instance variables
        self.num_body = num_body
        self.num_neck = num_neck
        self.num_paint = num_paint
        self.num_ensam = num_ensam
        
        # Calculate material requirements based on staffing
        hourly_wood_usage = (num_body * 2) + num_neck  # Each body maker uses 2, each neck maker uses 1
        hourly_electronic_usage = num_ensam  # Each assembler uses 1

        # Set order quantities and critical levels based on usage
        wood_order_size = int(hourly_wood_usage * hours * 3)  # 3 days worth of wood
        electronic_order_size = int(hourly_electronic_usage * hours * 3)  # 3 days worth of electronics
        wood_critical_level = int(hourly_wood_usage * hours * 2)  # 2 days worth of wood
        electronic_critical_level = int(hourly_electronic_usage * hours * 2)  # 2 days worth of electronics

        self.params = {
            'wood_capacity': 1000,
            'initial_wood': wood_order_size,
            'electronic_capacity': 500,
            'initial_electronic': electronic_order_size,
            'body_pre_paint_capacity': 60,
            'neck_pre_paint_capacity': 60,
            'body_post_paint_capacity': 120,
            'neck_post_paint_capacity': 120,
            'dispatch_capacity': 500,
            'wood_critical_stock': wood_critical_level,
            'electronic_critical_level': electronic_critical_level,
            'wood_order_size': wood_order_size,
            'electronic_order_size': electronic_order_size,
            'num_body': num_body,
            'num_neck': num_neck,
            'num_paint': num_paint,
            'num_ensam': num_ensam,
            'hours': hours,
            'dispatch_threshold': dispatch_threshold,
        }

        # Create the factory once and keep it for the entire game
        self.env = simpy.Environment()
        self.guitar_factory = Guitar_Factory(self.env, self.params)

    def update_params(self, new_params):
        """Update parameters between weeks"""
        # Update worker counts
        self.guitar_factory.total_workers = {
            'body_makers': new_params.get('num_body', self.num_body),
            'neck_makers': new_params.get('num_neck', self.num_neck),
            'painters': new_params.get('num_paint', self.num_paint),
            'assemblers': new_params.get('num_ensam', self.num_ensam)
        }
        # Update dispatch threshold
        self.guitar_factory.dispatch_threshold = new_params.get('dispatch_threshold', self.params['dispatch_threshold'])
        
        # Update internal params
        self.params.update(new_params)

    def calculate_weekly_financials(self, weekly_production):
        """Calculate financial results including demand penalties"""
        weekly_demand = self.weekly_demand
        overproduction = max(0, weekly_production - weekly_demand)
        
        # Update total production
        self.total_production += weekly_production
        
        # Only calculate demand penalty in final week AND only if total production is less than demand
        demand_penalty = 0
        if self.current_week == 4:
            if self.total_production < self.total_demand:
                total_underproduction = self.total_demand - self.total_production
                demand_penalty = total_underproduction * (self.guitar_factory.costs['guitar_sale_price'] * 0.5)
        
        # Calculate labor costs
        weekly_hours = self.hours * self.days
        labor_costs = 0
        labor_costs += self.num_body * self.guitar_factory.calculate_worker_pay(weekly_hours, 'body_maker')
        labor_costs += self.num_neck * self.guitar_factory.calculate_worker_pay(weekly_hours, 'neck_maker')
        labor_costs += self.num_paint * self.guitar_factory.calculate_worker_pay(weekly_hours, 'painter')
        labor_costs += self.num_ensam * self.guitar_factory.calculate_worker_pay(weekly_hours, 'assembler')
        
        # Calculate fixed costs
        fixed_costs = self.guitar_factory.costs['daily_fixed_costs'] * self.days

        # Update finances
        self.guitar_factory.finances['labor_costs'] = labor_costs
        self.guitar_factory.finances['fixed_costs'] = fixed_costs
        self.guitar_factory.finances['demand_penalty'] = demand_penalty
        
        remaining_demand = self.total_demand - self.total_production
        
        return overproduction, demand_penalty, remaining_demand

    def get_final_state(self):
        """Get the final state of all storage containers"""
        return {
            'wood_level': self.guitar_factory.wood.level,
            'electronic_level': self.guitar_factory.electronic.level,
            'body_pre_paint': self.guitar_factory.body_pre_paint.level,
            'neck_pre_paint': self.guitar_factory.neck_pre_paint.level,
            'body_post_paint': self.guitar_factory.body_post_paint.level,
            'neck_post_paint': self.guitar_factory.neck_post_paint.level,
            'dispatch': self.guitar_factory.dispatch.level,
            'total_guitars': self.guitar_factory.guitars_made + self.guitar_factory.dispatch.level
        }

    def run_weekly_simulation(self):
        """Run simulation for one week"""
        # Store starting guitar count for this week
        start_guitars = self.guitar_factory.guitars_made + self.guitar_factory.dispatch.level
        
        # Store current container levels
        old_levels = {
            'wood': self.guitar_factory.wood.level,
            'electronic': self.guitar_factory.electronic.level,
            'body_pre_paint': self.guitar_factory.body_pre_paint.level,
            'neck_pre_paint': self.guitar_factory.neck_pre_paint.level,
            'body_post_paint': self.guitar_factory.body_post_paint.level,
            'neck_post_paint': self.guitar_factory.neck_post_paint.level,
            'dispatch': self.guitar_factory.dispatch.level
        }
        
        # Clear logs for new week but keep everything else
        self.guitar_factory.logs = []
        
        # Create new environment
        self.env = simpy.Environment()
        
        # Recreate containers with preserved levels
        self.guitar_factory.wood = simpy.Container(self.env, capacity=self.params['wood_capacity'], 
                                                 init=old_levels['wood'])
        self.guitar_factory.electronic = simpy.Container(self.env, capacity=self.params['electronic_capacity'], 
                                                   init=old_levels['electronic'])
        self.guitar_factory.body_pre_paint = simpy.Container(self.env, capacity=self.params['body_pre_paint_capacity'], 
                                                            init=old_levels['body_pre_paint'])
        self.guitar_factory.neck_pre_paint = simpy.Container(self.env, capacity=self.params['neck_pre_paint_capacity'], 
                                                            init=old_levels['neck_pre_paint'])
        self.guitar_factory.body_post_paint = simpy.Container(self.env, capacity=self.params['body_post_paint_capacity'], 
                                                             init=old_levels['body_post_paint'])
        self.guitar_factory.neck_post_paint = simpy.Container(self.env, capacity=self.params['neck_post_paint_capacity'], 
                                                             init=old_levels['neck_post_paint'])
        self.guitar_factory.dispatch = simpy.Container(self.env, capacity=self.params['dispatch_capacity'], 
                                                     init=old_levels['dispatch'])
        
        # Initialize control processes
        self.guitar_factory.wood_control = self.env.process(
            self.guitar_factory.wood_stock_control(self.env, self.params['wood_critical_stock']))
        self.guitar_factory.electronic_control = self.env.process(
            self.guitar_factory.electronic_stock_control(self.env))
        self.guitar_factory.dispatch_control = self.env.process(
            self.guitar_factory.dispatch_guitars_control(self.env))
        self.guitar_factory.worker_control = self.env.process(
            self.guitar_factory.update_worker_availability(self.env))
        
        # Initialize workers
        def initialize_workers(env, factory):
            for worker_id in range(factory.total_workers['body_makers']):
                if random.random() > SICK_DAY_PROBABILITY:
                    factory.available_workers['body_makers'].append(worker_id)
                    env.process(body_maker(env, factory, worker_id))
            for worker_id in range(factory.total_workers['neck_makers']):
                if random.random() > SICK_DAY_PROBABILITY:
                    factory.available_workers['neck_makers'].append(worker_id)
                    env.process(neck_maker(env, factory, worker_id))
            for worker_id in range(factory.total_workers['painters']):
                if random.random() > SICK_DAY_PROBABILITY:
                    factory.available_workers['painters'].append(worker_id)
                    env.process(painter(env, factory, worker_id))
            for worker_id in range(factory.total_workers['assemblers']):
                if random.random() > SICK_DAY_PROBABILITY:
                    factory.available_workers['assemblers'].append(worker_id)
                    env.process(assembler(env, factory, worker_id))
        
        initialize_workers(self.env, self.guitar_factory)
        
        # Run simulation
        self.env.run(until=self.total_time)
        
        # Calculate weekly production
        end_guitars = self.guitar_factory.guitars_made + self.guitar_factory.dispatch.level
        weekly_production = end_guitars - start_guitars
        
        overproduction, demand_penalty, remaining_demand = self.calculate_weekly_financials(weekly_production)
        
        return WeeklyResult(
            guitars_made=weekly_production,  # Return only this week's production
            logs=self.guitar_factory.logs,
            final_state=self.get_final_state(),
            financial_results=self.guitar_factory.finances,
            week_number=self.current_week,
            remaining_demand=remaining_demand,
            overproduction=overproduction,
            demand_penalty=demand_penalty
        )

def run_factory_simulation(params: dict) -> SimulationResult:
    simulation = GuitarFactorySimulation(
        hours=params.get('hours', 8),
        days=params.get('days', 5),
        num_body=params.get('num_body', 2),
        num_neck=params.get('num_neck', 1),
        num_paint=params.get('num_paint', 3),
        num_ensam=params.get('num_ensam', 2),
        dispatch_threshold=params.get('dispatch_threshold', 50)
    )
    return simulation.run_simulation()
