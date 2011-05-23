"""
Pulls down all the news from 10:10's web site, and adds it to a redis zset, by 
timestamp.
"""

import urllib2
import urllib
import json
import datetime
import time
import re
import redis
import BeautifulSoup


class Scraper():
    def __init__(self):
        self.r = redis.Redis()
        self.base_url = "http://www.1010global.org/uk/news"
        self.next = False
        self.page = 0
    
    def format_url(self):
        return "%s?page=%s" % (self.base_url, self.page)
    
    def get_page(self):
        print self.page
        page = urllib2.urlopen(self.format_url())
        soup = BeautifulSoup.BeautifulSoup(page.read(), convertEntities=BeautifulSoup.BeautifulStoneSoup.HTML_ENTITIES)
        for el in soup.findAll('div', {'class' : 'node'}):
            self.parse_el(el)
        has_next = soup.find('li', {'class' : 'pager-next last'}).a
        if has_next:
            self.page = self.page + 1
            self.next = True
        else:
            self.next = False

    def parse_el(self, el):
        try:
            item = {}
            key = "1010::news::%s" % el.attrMap['id']
            item['title'] = el.h2.a.string
            item['url'] = el.h2.a['href']
            
            data_string = el.span.string
            result_timestamp = time.mktime(time.strptime(data_string, "%d %b %y"))
            result_timestamp = int(result_timestamp)
            
            content = el.find('div', {'class' : 'content clear-block'}).findAll({'h4' : True, 'p' : True})
            content_list = []
            for t in content:
                content_list.append(''.join([e for e in t.recursiveChildGenerator() if isinstance(e,unicode)]).strip())
            item['content_string'] = "".join(content_list)
            
            for k,v in item.items():
                self.r.hset("%s::hash" % key, k, v)
            self.r.zadd('all_news', key, result_timestamp)
            
        except Exception, e:
            pass

s = Scraper()
s.get_page()
while s.next:
    s.get_page()


