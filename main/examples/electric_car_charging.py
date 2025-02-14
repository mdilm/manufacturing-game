import simpy

def car(env, name, charging_station, driving_time, charge_duration):
    # Simulate driving to the charging station
    yield env.timeout(driving_time)

    # Request one of its charging spots
    print('%s arriving at %d' % (name, env.now))
    with charging_station.request() as req:
        yield req

        # Charge the battery
        print('%s starting to charge at %s' % (name, env.now))
        yield env.timeout(charge_duration)
        print('%s leaving the charging station at %s' % (name, env.now))

def main():
    env = simpy.Environment()
    charging_station = simpy.Resource(env, capacity=2)
    for i in range(4):
        env.process(car(env, 'Car %d' % i, charging_station, i*2, 5))
    env.run()

if __name__ == '__main__':
    main()
