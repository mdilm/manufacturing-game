import simpy
import random
from dataclasses import dataclass
from typing import List, Dict

@dataclass
class SimulationResult:
    guitars_made: int
    logs: List[str]
    final_state: Dict

class Guitar_Factory:
    def __init__(self, env, params):
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

    def log(self, message):
        self.logs.append(message)

    def wood_stock_control(self, env, wood_critical_stock):
        yield env.timeout(0)
        while True:
            if self.wood.level <= wood_critical_stock:
                self.log(f'wood stock below critical level ({self.wood.level}) at day {int(env.now/8)}, hour {env.now % 8}')
                self.log('calling wood supplier')
                self.log('----------------------------------')
                yield env.timeout(16)
                self.log('wood supplier arrives at day {0}, hour {1}'.format(
                    int(env.now/8), env.now % 8))
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
                self.log(f'electronic stock below critical level ({self.electronic.level}) at day {int(env.now/8)}, hour {env.now % 8}')
                self.log('calling electronic supplier')
                self.log('----------------------------------')
                yield env.timeout(9)
                self.log('electronic supplier arrives at day {0}, hour {1}'.format(
                    int(env.now/8), env.now % 8))
                yield self.electronic.put(30)
                self.log('new electronic stock is {0}'.format(
                    self.electronic.level))
                self.log('----------------------------------')
                yield env.timeout(8)
            else:
                yield env.timeout(1)
                
    def dispatch_guitars_control(self, env):
        yield env.timeout(0)
        while True:
            if self.dispatch.level >= 50:
                self.log(f'dispach stock is {self.dispatch.level}, calling store to pick guitars at day {int(env.now/8)}, hour {env.now % 8}')
                self.log('----------------------------------')
                yield env.timeout(4)
                self.log(f'store picking {self.dispatch.level} guitars at day {int(env.now/8)}, hour {env.now % 8}')
                self.guitars_made += self.dispatch.level
                yield self.dispatch.get(self.dispatch.level)
                self.log('----------------------------------')
                yield env.timeout(8)
            else:
                yield env.timeout(1)

def body_maker(env, factory):
    while True:
        yield factory.wood.get(2)
        yield env.timeout(1)
        yield factory.body_pre_paint.put(1)

def neck_maker(env, factory):
    while True:
        yield factory.wood.get(1)
        yield env.timeout(1)
        yield factory.neck_pre_paint.put(1)

def painter(env, factory):
    while True:
        if factory.body_pre_paint.level > 0 and factory.neck_pre_paint.level > 0:
            yield factory.body_pre_paint.get(1)
            yield factory.neck_pre_paint.get(1)
            yield env.timeout(2)
            yield factory.body_post_paint.put(1)
            yield factory.neck_post_paint.put(1)
        else:
            yield env.timeout(1)

def assembler(env, factory):
    while True:
        if factory.body_post_paint.level > 0 and factory.neck_post_paint.level > 0 and factory.electronic.level > 0:
            yield factory.body_post_paint.get(1)
            yield factory.neck_post_paint.get(1)
            yield factory.electronic.get(1)
            yield env.timeout(1)
            yield factory.dispatch.put(1)
        else:
            yield env.timeout(1)

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
            'wood_critical_stock': ((8/1) * num_body + (8/1) * num_neck) * 3
        }

    def run_simulation(self):
        env = simpy.Environment()
        self.guitar_factory = Guitar_Factory(env, self.params)

        # Define process generators
        def body_maker_gen(env, factory):
            for i in range(self.num_body):
                env.process(body_maker(env, factory))
                yield env.timeout(0)

        def neck_maker_gen(env, factory):
            for i in range(self.num_neck):
                env.process(neck_maker(env, factory))
                yield env.timeout(0)

        def painter_maker_gen(env, factory):
            for i in range(self.num_paint):
                env.process(painter(env, factory))
                yield env.timeout(0)

        def assembler_maker_gen(env, factory):
            for i in range(self.num_ensam):
                env.process(assembler(env, factory))
                yield env.timeout(0)

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

        return SimulationResult(
            guitars_made=self.guitar_factory.guitars_made + self.guitar_factory.dispatch.level,
            logs=self.guitar_factory.logs,
            final_state=final_state
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
