# 10:10 Signup map

This is an entry for the [10:10 Technical director job task](http://www.1010global.org/uk/2011/05/job-opening-technical-director).

The project visualises the 10:10 sign up data along side the 'News' section of the 10:10 web site, in an attempt to 'replay' the campaign to date.

It's possible to get a day-by-day snapshot of signups, as well as viewing the cumulative signups, up to a given date.

This is seen more as an interesting tool for inspecting some aspects of the campaign, rather than public facing (or even useful!) tool for real world use.

## Technical details
* Python was used to pull in data from the 10:10 API and to web scrape the 'news' section.
* Redis stores all the data, using a `zset` for the date range lookups
* node.js and various node modules provides the API
* Google Maps and Chart API are used with for displaying the data.


## Comments and Disclaimer
* Due to the nature of the task and the time frame, this should be considered a 'hack day' style project, rather than production ready code.

* The 10:10 API doesn't expose unique IDs per signup.  The date and name of the signee was considered unique in this case.

* The task would have been made easier if a single dump of the data had been made public.  

* Signees could be geocoded by 10:10, to save consumers of the data doing it.

* Little attempt has been made to geocode non-UK signees.

* Some of the postcodes stored don't exist.  These signees have been ignored.
