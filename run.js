console.log("Initializing...");

const tiny = require('tiny-json-http');
const mc = require('minecraft-protocol');
const dotenv = require('dotenv');

dotenv.config();

const pcKey = process.env["PROXYCHECK_KEY"];
const pcEndpoint = 'https://proxycheck.io/v2/';
const pcArgs = '?vpn=1&asn=1';

var host = process.env["SERVER_HOST"];
host = (host == undefined ? '0.0.0.0' : host);
var port = process.env["SERVER_PORT"];
port = (port == undefined ? '25565' : port);
var debug = process.env["DEBUG"];
debug = (debug == undefined ? false : (debug == 'true' ? true : false));
var messagesJson = process.env["MESSAGES_JSON"];
messagesJson = (messagesJson == undefined ? "./messages.json" : messagesJson);
var logConn = process.env["LOG_CONNECTIONS"];
logConn = (logConn == undefined ? true : (logConn == 'true' ? true : false));
var logPing = process.env["LOG_PINGS"];
logPing = (logPing == undefined ? false : (logPing == 'true' ? true : false));

const messages = require(messagesJson);
const motd = JSON.stringify(messages["motd"]);
const details = JSON.stringify(messages["details"]);
const proxyColor = messages["proxyColor"];
const notProxyColor = messages["notProxyColor"];

if (debug) {
    console.log(process.env);
    console.log(messages);
}

console.log(`Starting the server...`);

var server = mc.createServer({
  host: host,
  port: port,
  version: '1.8.9',
  'online-mode': false,
  maxPlayers: 1,
  beforePing: beforePing,
  beforeLogin: beforeLogin
});

function beforePing(resp, client) {
  if (debug) console.log(client.socket)
  const ip = client.socket.remoteAddress;
  if (ip == undefined) return;
  if (logPing) console.log("Ping: " + ip);
  const parts = ip.split('.');
  const ip0 = parts[0];
  const ip1 = parts[1];
  const ip2 = parts[2];
  const ip3 = parts[3];
  const oip0 = "X".repeat(ip0.length);
  const oip1 = "X".repeat(ip1.length);
  const oip2 = "X".repeat(ip2.length);
  const oip3 = "X".repeat(ip3.length);
  resp['description'] = JSON.parse(motd.replace("%ip0%", ip0).replace("%ip1%", ip1).replace("%ip2%", ip2).replace("%ip3%", ip3)
      .replace("%oip0%", oip0).replace("%oip1%", oip1).replace("%oip2%", oip2).replace("%oip3%", oip3));
}

function beforeLogin(client) {
  if (debug) console.log(client.socket)
  const ip = client.socket.remoteAddress;
  if (ip == undefined) return;
  if (logConn) console.log("Conn: " + ip);
  const url = pcEndpoint + ip + pcArgs + '?key=' + pcKey;
  tiny.get({url}, function _get(err, result) {
    if (debug) console.log(result.body);
    const status = result.body["status"];
    if (status == "denied" || status == "error") {
      console.log('API returned an error: ');
      console.log(result.body["message"]);
      client.end('err', "API error. Please contact an administrator.")
      return;
    }
    const response = result.body[ip];
    var continent = response['continent'];
    continent = (continent != undefined ? continent : "Unknown")
    var country = response['country'];
    country = (country != null ? country : "Unknown")
    var region = response['region'];
    region = (region != null ? region : "Unknown")
    var city = response['city'];
    city = (city != null ? city : "Unknown")
    const asn = response['asn'];
    const provider = response['provider'];
    var org = response['organisation'];
    org = (org != undefined ? org : provider)
    const proxy = response['proxy'];
    const type = response['type'];
    const proxyColorStr = (proxy == "yes" ? proxyColor : notProxyColor);
    client.end('info',
      details.replace("%ip%", ip).replace("%country%", country).replace("%continent%", continent).replace("%city%", city).replace("%region%", region)
      .replace("%asn%", asn).replace("%provider%", provider).replace("%org%", org)
      .replace("%proxy%", proxy).replace("%type%", type).replace("%proxyColor%", proxyColorStr)
    );
  });
}

server.once('listening', () => {
  console.log(`Server listening on ${host}:${port}`);
});
