const tiny = require('tiny-json-http');
const mc = require('minecraft-protocol');
const dotenv = require('dotenv');

dotenv.config();
console.log(process.env);

const pcKey = process.env["PROXYCHECK_KEY"];
const pcEndpoint = 'https://proxycheck.io/v2/';
const pcArgs = '?vpn=1&asn=1';

var server = mc.createServer({
	  host: process.env["SERVER_HOST"],
	  port: process.env["SERVER_PORT"],
	  version: '1.8.9',
	  'online-mode': false,
      maxPlayers: 1,
	  beforePing: beforePing,
	  beforeLogin: beforeLogin
});

function beforePing(resp, client) {
  console.log("Ping: " + client.socket.remoteAddress);
  var ip = client.socket.remoteAddress;
  var parts = ip.split('.');
  var json = {
    "text": "Your IP: ",
    "color": "aqua",
    "extra": [
      { "text": `${parts[0]}.${parts[1]}.`, "bold": true },
      { "text": `${'x'.repeat(parts[2].length)}`, "bold": true, "obfuscated": true },
      { "text": ".", "bold": true },
      { "text": `${'x'.repeat(parts[3].length)}`, "bold": true, "obfuscated": true },
      { "text": "\nJoin for detailed info", "color": "gold" }
    ]
  };
  resp['description'] = json;
 // fs.writeFile(`ping/${ip}`,'', ()=>{});
  //resp['version'] = { 'name': 'myip.pivipi.net', 'protocol': '69' }
}

//server.on('login', function(client) {
function beforeLogin(client) {
  console.log("Conn: " + client.socket.remoteAddress)
  if (client.socket.remoteAddress == undefined) return;
  var ip = client.socket.remoteAddress;
  var url = pcEndpoint + ip + pcArgs;
  tiny.get({url}, function _get(err, result) {
    var status = result.body[status];
    if (status == "denied") {
      console.log('API returned an error: ');
      console.log(status["message"]);
      return;
    }
    var response = result.body[ip];
    var continent = response['continent'];
    continent = (continent != undefined ? continent : "Unknown")
    var country = response['country'];
    country = (country != null ? country : "Unknown")
    var region = response['region'];
    region = (region != null ? region : "Unknown")
    var city = response['city'];
    city = (city != null ? city : "Unknown")
    var asn = response['asn'];
    var provider = response['provider'];
    var organisation = response['organisation'];
    var type = response['type'];
    var proxy = response['proxy'];
    var proxyColor = (proxy == "yes" ? "red" : "green");
    var orgPart = (organisation != undefined ? `{"text":"\naka ","color":"aqua"},{"text":"${organisation}","color":"gold","bold":"true"},` : '')
    var kickJson = `{"text":"Details for ","color":"green","extra": [{"text":"${ip}\n\n","bold":true,"color":"gold"},{"text":"----","strikethrough":true,"color":"aqua"},{"text":" GEO ","bold":true,"color":"aqua"},{"text":"----","strikethrough":true,"color":"aqua"},{"text":"\nCountry: ","color":"aqua"},{"text":"${country}","bold":true,"color":"yellow"},{"text":", ","color":"yellow"},{"text":"${continent}","color":"light_purple"},{"text":"\n"},{"text":"City: ","color":"aqua"},{"text":"${city}","bold":true,"color":"yellow"},{"text":", ","color":"yellow"},{"text":"${region}","color":"light_purple"},{"text":"\n\n"},{"text":"----","strikethrough":true,"color":"aqua"},{"text":" ISP ","bold":true,"color":"aqua"},{"text":"----","strikethrough":true,"color":"aqua"},{"text":"\n${asn}","bold":true,"color":"yellow"},{"text":" ${provider}","color":"light_purple"},${orgPart}{"text":"\nProxy: ","color":"aqua"},{"text":"${proxy}","color":"${proxyColor}","bold":"true"},{"text":" (${type})","color":"light_purple"},{"text":"\n\nJoin our Discord server:\n","color":"green"},{"text":"https://discord.gg/UzEfm7e","bold":true,"color":"green"}]}`
    client.end('info', kickJson);
    //fs.writeFile(`conn/${ip}`,'',()=>{});
  });
}
