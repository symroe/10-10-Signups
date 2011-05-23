"""
Backs up and restores a set of redis keys from a CSV file.
"""
import sys
import csv
import redis
r = redis.Redis()

def dump():
    csv_file = csv.writer(open('geocoded_cache.csv', 'w'))
    geocoded = r.keys("1010::postcode::*")
    for k in geocoded:
        csv_file.writerow([k, r.get(k)])

def load():
    csv_file = csv.reader(open('geocoded_cache.csv', 'r'))
    for row in csv_file:
        r.set(row[0], row[1])
    
if 'dump' in sys.argv:
    print "Dumping"
    dump()
if 'load' in sys.argv:
    print "Loading"
    load()