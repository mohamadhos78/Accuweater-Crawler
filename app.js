const request = require('request-promise');
const cheerio = require('cheerio');
const fs = require('fs');

var url = "https://www.accuweather.com/en/gb/london/ec4a-2/september-weather/328328?year=2021";

async function main (url) {
  console.log('main');
  const response = await request({
    uri: url,
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8,ro;q=0.7,ru;q=0.6,la;q=0.5,pt;q=0.4,de;q=0.3',
      'Cache-Control': 'max-age=0',
      'Connection': 'keep-alive',
      'Host': 'www.accuweather.com',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:92.0) Gecko/20100101 Firefox/92.0'
    },
    gzip: true
  })
  return response
};

async function getMainDetails (response) {
  console.log('getMainDetails');
  const $ = cheerio.load(response);
  let days = $('div.monthly-calendar a')
  days_temp = [];
  for(day of days) {
    let data = {}
    let date = $(day).find('div.date').text().replace(/\s/g, '')
    let low = $(day).find('div.temp div.low').text().replace(/\s/g, '')
    let high = $(day).find('div.temp div.high').text().replace(/\s/g, '')
    let details_link = $(day).attr('href')
    if (details_link){
      details_link = "https://www.accuweather.com" + details_link
      let details = await getDayDetails(details_link)
      data[`${date}`] = {'low':low,'high':high,'details':details}
    }else {
      data[`${date}`] = {'low':low,'high':high}
    }
    days_temp.push(data);
  }
  return days_temp
  // console.log(days_temp);
}

async function getDayDetails(url){
  const response = await request({
    uri: url,
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8,ro;q=0.7,ru;q=0.6,la;q=0.5,pt;q=0.4,de;q=0.3',
      'Cache-Control': 'max-age=0',
      'Connection': 'keep-alive',
      'Host': 'www.accuweather.com',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:92.0) Gecko/20100101 Firefox/92.0'
    },
    gzip: true
  })
  const $ = await cheerio.load(response);
  let halfDay = $('.half-day-card.content-module ')
  let halfDayContent = []
  for (half of halfDay) {
    let panelsContent = []
    data = {
      title : $(half).find("h2.title").text().replace(/\s/g, ''),
      description : $(half).find('div.phrase').text(),
      realFeel : $(half).find('div.real-feel div').text().replace(/\s/g, ''),
      realFeelShade : $(half).find('div.real-feel div div').text().replace(/\s/g, '')
    }
    let panels = $(half).find('div.panels p.panel-item')
    for (panel of panels){
      // let panelContent = {}
      let panelValue = $(panel).find('span.value').text().replace(/\s/g, '')
      let panelKey = $(panel).text().replace(/\s/g, '').replace(panelValue, '')
      data[`${panelKey}`] = panelValue
      // panelsContent.push(await data)
      // console.log(data," panel");
    }
    // data['panels'] = await panelsContent
    halfDayContent.push(data)
    // console.log(panelsContent);
  }
  // console.log(halfDayContent);
  return halfDayContent;
}

async function insertFile(data) {

  // stringify JSON Object
  var jsonContent = await JSON.stringify(data);
  console.log(jsonContent);

  var jsonObj = await JSON.parse(jsonContent);
  console.log(jsonObj);

  await fs.writeFile("output.json", jsonContent, 'utf8', function (err) {
      if (err) {
          console.log("An error occured while writing JSON Object to File.");
          return console.log(err);
      }
      console.log("JSON file has been saved.");
  });
}

async function run (url) {
  console.log("run");
  const response = await main(url);
  let data = await getMainDetails(response);
  insertFile(data);
}

run(url)
