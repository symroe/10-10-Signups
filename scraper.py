"""
Designed to cache all the data from the 10:10 API, and store in a local file, 
for later use.
"""
import time
import urllib2
import urllib
import json
import datetime
import time
import re
import redis

class Scraper():
    def __init__(self):
        self.r = redis.Redis()
        self.base_url = "http://data.1010global.org/api/signups"
        self.cursor = ""
        self.next = False
        self.page = 0
    
    def make_url(self):
        return "%s?cursor=%s" % (self.base_url, self.cursor)
    
    def get_page(self):
        # try to get a cached copy of the page, for testing only
        try:
            page = open('cached_data/tmp_page-%s.json' % self.page).read()
        except:
            page = urllib2.urlopen(self.make_url()).read()
            open('cached_data/tmp_page-%s.json' % self.page, 'w').write(page)
        
        json_page = json.loads(page)
        self.results =  json_page['results']
        
        self.page = self.page + 1
        
        if json_page.get('next'):
            self.next = True
            self.cursor = json_page['next'].split('=')[-1]
        else:
            self.next = False
    
    def  make_key(self, result):
        location = self.geocode(result)
        if location:
            cleaned_name = re.sub(r'[^a-zA-Z]+', '', result['name']).lower()
            key = "1010::%s--%s--%s" % (result['timestamp'], cleaned_name, location)
            return key
        
    def geocode(self, result):
        if not result.get('postcode'):
            return None
        postcode = result['postcode'].replace(' ', '')
        location = None
        
        cached_location = self.r.get('1010::postcode::%s' % postcode)
        if cached_location:
            return cached_location
        try:
            url = "http://mapit.mysociety.org/postcode/%s" % re.sub(" ", "", postcode)
            location_json = json.loads(urllib2.urlopen(url).read())
            location = "%sx%s" % (location_json['wgs84_lat'], location_json['wgs84_lon'])
        except:
            print "problem with mapit, trying google"
            try:
                gurl = "http://maps.google.com/maps/api/geocode/json?sensor=false&address=%s" % urllib.quote(postcode)
                location_json = json.loads(urllib2.urlopen(gurl).read())['results'][0]['geometry']['location']
                location = "%sx%s" % (location_json['lat'], location_json['lng'])
            except Exception, e:
                print "nothing worked with postcode %s" % postcode
                print e
        
        self.r.set('1010::postcode::%s' % postcode, location)
        
        time.sleep(2)
        return location
        
    
    def parse_results(self):
        for result in self.results:
            # Sometimes, the timestamp doesn't have microseconds :(
            if len(result['signed_up_datetime'].split('.')) == 2:
                result_timestamp = time.mktime(time.strptime(
                    result['signed_up_datetime'], 
                    "%Y-%m-%dT%H:%M:%S.%f"))
            else:
                result_timestamp = time.mktime(time.strptime(
                    result['signed_up_datetime'], 
                    "%Y-%m-%dT%H:%M:%S"))

            result['timestamp'] = int(result_timestamp)

            # Some other time stamps are just borked...
            if result['timestamp'] < 0:
                continue
            result_key = self.make_key(result)
            
            for k,v in result.items():
                self.r.hset("%s::hash" % result_key, k, v)
            self.r.zadd('all_signups', result_key, result['timestamp'])


s = Scraper()
# Get the first page
s.get_page()
while s.next:
    s.get_page()
    s.parse_results()