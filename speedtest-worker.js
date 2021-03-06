function tlog (s) {
  log += Date.now() + ': ' + s + '\n'
}

function twarn (s) {
  log += Date.now() + ' WARN: ' + s + '\n', console.warn(s)
}

function url_sep (url) {
  return url.match(/\?/) ? '&' : '?'
}

function clearRequests () {
  if (tlog('stopping pending XHRs'), xhr) {
    for (var i = 0; i < xhr.length; i++) {
      try {
        xhr[i].onprogress = null, xhr[i].onload = null, xhr[i].onerror = null
      } catch (e) {}
      try {
        xhr[i].upload.onprogress = null, xhr[i].upload.onload = null, xhr[i].upload.onerror = null
      } catch (e) {}
      try {
        xhr[i].abort()
      } catch (e) {}
      try {
        delete xhr[i]
      } catch (e) {}
    }
    xhr = null
  }
}

function getIp(done) {
    tlog('getIp'), ipCalled || (ipCalled = !0, xhr = new XMLHttpRequest, xhr.onload = function() {
        tlog('IP: ' + xhr.responseText), clientIp = xhr.responseText, done()
    }, xhr.onerror = function() {
        tlog('getIp failed'), done()
    }, xhr.open('GET', settings.url_getIp + url_sep(settings.url_getIp) + (settings.getIp_ispInfo ? 'isp=true' : '') + 'r=' + Math.random(), !0), xhr.send())
}

function dlTest(done) {
    if (tlog('dlTest'), !dlCalled) {
        dlCalled = !0;
        var totLoaded = 0,
            startT = (new Date).getTime(),
            graceTimeDone = !1,
            failed = !1;
        xhr = [];
        for (var testStream = function(i, delay) {
                setTimeout(function() {
                    if (1 === testStatus) {
                        tlog('dl test stream started ' + i + ' ' + delay);
                        var prevLoaded = 0,
                            x = new XMLHttpRequest;
                        xhr[i] = x, xhr[i].onprogress = function(event) {
                            if (tlog('dl stream progress event ' + i + ' ' + event.loaded), 1 !== testStatus) try {
                                x.abort()
                            } catch (e) {}
                            var loadDiff = event.loaded <= 0 ? 0 : event.loaded - prevLoaded;
                            isNaN(loadDiff) || !isFinite(loadDiff) || 0 > loadDiff || (totLoaded += loadDiff, prevLoaded = event.loaded)
                        }.bind(this), xhr[i].onload = function() {
                            tlog('dl stream finished ' + i);
                            try {
                                xhr[i].abort()
                            } catch (e) {}
                            testStream(i, 0)
                        }.bind(this), xhr[i].onerror = function() {
                            tlog('dl stream failed ' + i), 0 === settings.xhr_ignoreErrors && (failed = !0);
                            try {
                                xhr[i].abort()
                            } catch (e) {}
                            delete xhr[i], 1 === settings.xhr_ignoreErrors && testStream(i, 0)
                        }.bind(this);
                        try {
                            settings.xhr_dlUseBlob ? xhr[i].responseType = 'blob' : xhr[i].responseType = 'arraybuffer'
                        } catch (e) {}
                        xhr[i].open('GET', settings.url_dl + url_sep(settings.url_dl) + 'r=' + Math.random() + '&ckSize=' + settings.garbagePhp_chunkSize, !0), xhr[i].send()
                    }
                }.bind(this), 1 + delay)
            }.bind(this), i = 0; i < settings.xhr_dlMultistream; i++) testStream(i, settings.xhr_multistreamDelay * i);
        interval = setInterval(function() {
            tlog('DL: ' + dlStatus + (graceTimeDone ? '' : ' (in grace time)'));
            var t = (new Date).getTime() - startT;
            if (graceTimeDone && (dlProgress = t / (1e3 * settings.time_dl)), !(200 > t))
                if (graceTimeDone) {
                    var speed = totLoaded / (t / 1e3);
                    dlStatus = (8 * speed * settings.overheadCompensationFactor / (settings.useMebibits ? 1048576 : 1e6)).toFixed(2), (t / 1e3 > settings.time_dl && dlStatus > 0 || failed) && ((failed || isNaN(dlStatus)) && (dlStatus = 'Fail'), clearRequests(), clearInterval(interval), dlProgress = 1, tlog('dlTest finished ' + dlStatus), done())
                } else t > 1e3 * settings.time_dlGraceTime && (totLoaded > 0 && (startT = (new Date).getTime(), totLoaded = 0), graceTimeDone = !0)
        }.bind(this), 200)
    }
}

function ulTest(done) {
    if (tlog('ulTest'), !ulCalled) {
        ulCalled = !0;
        var totLoaded = 0,
            startT = (new Date).getTime(),
            graceTimeDone = !1,
            failed = !1;
        xhr = [];
        for (var testStream = function(i, delay) {
                setTimeout(function() {
                    if (3 === testStatus) {
                        tlog('ul test stream started ' + i + ' ' + delay);
                        var prevLoaded = 0,
                            x = new XMLHttpRequest;
                        xhr[i] = x;
                        var ie11workaround;
                        if (settings.forceIE11Workaround) ie11workaround = !0;
                        else try {
                            xhr[i].upload.onprogress, ie11workaround = !1
                        } catch (e) {
                            ie11workaround = !0
                        }
                        ie11workaround ? (xhr[i].onload = function() {
                            tlog('ul stream progress event (ie11wa)'), totLoaded += reqsmall.size, testStream(i, 0)
                        }, xhr[i].onerror = function() {
                            tlog('ul stream failed (ie11wa)'), 0 === settings.xhr_ignoreErrors && (failed = !0);
                            try {
                                xhr[i].abort()
                            } catch (e) {}
                            delete xhr[i], 1 === settings.xhr_ignoreErrors && testStream(i, 0)
                        }, xhr[i].open('POST', settings.url_ul + url_sep(settings.url_ul) + 'r=' + Math.random(), !0), xhr[i].setRequestHeader('Content-Encoding', 'identity'), xhr[i].send(reqsmall)) : (xhr[i].upload.onprogress = function(event) {
                            if (tlog('ul stream progress event ' + i + ' ' + event.loaded), 3 !== testStatus) try {
                                x.abort()
                            } catch (e) {}
                            var loadDiff = event.loaded <= 0 ? 0 : event.loaded - prevLoaded;
                            isNaN(loadDiff) || !isFinite(loadDiff) || 0 > loadDiff || (totLoaded += loadDiff, prevLoaded = event.loaded)
                        }.bind(this), xhr[i].upload.onload = function() {
                            tlog('ul stream finished ' + i), testStream(i, 0)
                        }.bind(this), xhr[i].upload.onerror = function() {
                            tlog('ul stream failed ' + i), 0 === settings.xhr_ignoreErrors && (failed = !0);
                            try {
                                xhr[i].abort()
                            } catch (e) {}
                            delete xhr[i], 1 === settings.xhr_ignoreErrors && testStream(i, 0)
                        }.bind(this), xhr[i].open('POST', settings.url_ul + url_sep(settings.url_ul) + 'r=' + Math.random(), !0), xhr[i].setRequestHeader('Content-Encoding', 'identity'), xhr[i].send(req))
                    }
                }.bind(this), 1)
            }.bind(this), i = 0; i < settings.xhr_ulMultistream; i++) testStream(i, settings.xhr_multistreamDelay * i);
        interval = setInterval(function() {
            tlog('UL: ' + ulStatus + (graceTimeDone ? '' : ' (in grace time)'));
            var t = (new Date).getTime() - startT;
            if (graceTimeDone && (ulProgress = t / (1e3 * settings.time_ul)), !(200 > t))
                if (graceTimeDone) {
                    var speed = totLoaded / (t / 1e3);
                    ulStatus = (8 * speed * settings.overheadCompensationFactor / (settings.useMebibits ? 1048576 : 1e6)).toFixed(2), (t / 1e3 > settings.time_ul && ulStatus > 0 || failed) && ((failed || isNaN(ulStatus)) && (ulStatus = 'Fail'), clearRequests(), clearInterval(interval), ulProgress = 1, tlog('ulTest finished ' + ulStatus), done())
                } else t > 1e3 * settings.time_ulGraceTime && (totLoaded > 0 && (startT = (new Date).getTime(), totLoaded = 0), graceTimeDone = !0)
        }.bind(this), 200)
    }
}

function pingTest(done) {
    if (tlog('pingTest'), !ptCalled) {
        ptCalled = !0;
        var prevT = null,
            ping = 0,
            jitter = 0,
            i = 0,
            prevInstspd = 0;
        xhr = [];
        var doPing = function() {
            tlog('ping'), pingProgress = i / settings.count_ping, prevT = (new Date).getTime(), xhr[0] = new XMLHttpRequest, xhr[0].onload = function() {
                if (tlog('pong'), 0 === i) prevT = (new Date).getTime();
                else {
                    var instspd = (new Date).getTime() - prevT;
                    if (settings.ping_allowPerformanceApi) try {
                        var p = performance.getEntries();
                        p = p[p.length - 1];
                        var d = p.responseStart - p.requestStart;
                        0 >= d && (d = p.duration), d > 0 && instspd > d && (instspd = d)
                    } catch (e) {
                        tlog('Performance API not supported, using estimate')
                    }
                    var instjitter = Math.abs(instspd - prevInstspd);
                    1 === i ? ping = instspd : (ping = .9 * ping + .1 * instspd, jitter = instjitter > jitter ? .2 * jitter + .8 * instjitter : .9 * jitter + .1 * instjitter), prevInstspd = instspd
                }
                pingStatus = ping.toFixed(2), jitterStatus = jitter.toFixed(2), i++, tlog('PING: ' + pingStatus + ' JITTER: ' + jitterStatus), i < settings.count_ping ? doPing() : (pingProgress = 1, done())
            }.bind(this), xhr[0].onerror = function() {
                tlog('ping failed'), 0 === settings.xhr_ignoreErrors && (pingStatus = 'Fail', jitterStatus = 'Fail', clearRequests(), done()), 1 === settings.xhr_ignoreErrors && doPing(), 2 === settings.xhr_ignoreErrors && (i++, i < settings.count_ping ? doPing() : done())
            }.bind(this), xhr[0].open('GET', settings.url_ping + url_sep(settings.url_ping) + 'r=' + Math.random(), !0), xhr[0].send()
        }.bind(this);
        doPing()
    }
}

function sendTelemetry() {
    if (!(settings.telemetry_level < 1)) {
        xhr = new XMLHttpRequest, xhr.onload = function() {
                console.log('TELEMETRY OL ' + xhr.responseText)
            },
            xhr.onerror = function() {
                console.log('TELEMETRY ERROR ' + xhr)
            },
            xhr.open('POST', settings.url_telemetry + '?r=' + Math.random(), !0);
        try {
            var fd = new FormData;
            fd.append('dl', dlStatus),
                fd.append('ul', ulStatus),
                fd.append('ping', pingStatus),
                fd.append('jitter', jitterStatus),
                fd.append('log', settings.telemetry_level > 1 ? log : ''),
                xhr.send(fd)
        } catch (ex) {
            var postData = 'dl=' + encodeURIComponent(dlStatus) + '&ul=' + encodeURIComponent(ulStatus) + '&ping=' + encodeURIComponent(pingStatus) + '&jitter=' + encodeURIComponent(jitterStatus) + '&log=' + encodeURIComponent(settings.telemetry_level > 1 ? log : '');
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'),
                xhr.send(postData)
        }
    }
}
var testStatus = -1,
    dlStatus = '',
    ulStatus = '',
    pingStatus = '',
    jitterStatus = '',
    clientIp = '',
    dlProgress = 0,
    ulProgress = 0,
    pingProgress = 0,
    log = '',
    settings = {
        test_order: 'IP_D_U',
        time_ul: 15,
        time_dl: 15,
        time_ulGraceTime: 3,
        time_dlGraceTime: 1.5,
        count_ping: 35,
        url_dl: 'https://bos-lqt.perfectomobile.com/garbage.php',
        url_ul: 'https://bos-lqt.perfectomobile.com/empty.php',
        url_ping: 'https://bos-lqt.perfectomobile.com/empty.php',
        url_getIp: 'https://bos-lqt.perfectomobile.com/getIP.php',
        url_telemetry: 'https://bos-lqt.perfectomobile.com/telemetry.php',
        getIp_ispInfo: !0,
        xhr_dlMultistream: 10,
        xhr_ulMultistream: 3,
        xhr_multistreamDelay: 300,
        xhr_ignoreErrors: 1,
        xhr_dlUseBlob: !1,
        garbagePhp_chunkSize: 20,
        enable_quirks: !0,
        ping_allowPerformanceApi: !0,
        overheadCompensationFactor: 1.06,
        useMebibits: !1,
        telemetry_level: 0
    },
    xhr = null,
    interval = null,
    test_pointer = 0;

this.addEventListener('message', function(e) {
    var params = e.data.split(' ');
    if ('status' === params[0] && postMessage(testStatus + ';' + dlStatus + ';' + ulStatus + ';' + pingStatus + ';' + clientIp + ';' + jitterStatus + ';' + dlProgress + ';' + ulProgress + ';' + pingProgress), 'start' === params[0] && -1 === testStatus) {
        testStatus = 0;
        try {
            var s = {};
            try {
                var ss = e.data.substring(5);
                ss && (s = JSON.parse(ss))
            } catch (e) {
                twarn('Error parsing custom settings JSON. Please check your syntax')
            }
            for (var key in s) 'undefined' != typeof settings[key] ? settings[key] = s[key] : twarn('Unknown setting ignored: ' + key);
            if (settings.enable_quirks || 'undefined' != typeof s.enable_quirks && s.enable_quirks) {
                var ua = navigator.userAgent;
                /Firefox.(\d+\.\d+)/i.test(ua) && 'undefined' == typeof s.xhr_ulMultistream && (settings.xhr_ulMultistream = 1), /Edge.(\d+\.\d+)/i.test(ua) && 'undefined' == typeof s.xhr_dlMultistream && (settings.xhr_dlMultistream = 3), /Chrome.(\d+)/i.test(ua) && self.fetch && 'undefined' == typeof s.xhr_dlMultistream && (settings.xhr_dlMultistream = 5)
            }
            /Edge.(\d+\.\d+)/i.test(ua) && (settings.forceIE11Workaround = !0), 'undefined' != typeof s.telemetry_level && (settings.telemetry_level = 'basic' === s.telemetry_level ? 1 : 'full' === s.telemetry_level ? 2 : 0), settings.test_order = settings.test_order.toUpperCase()
        } catch (e) {
            twarn('Possible error in custom test settings. Some settings may not be applied. Exception: ' + e)
        }
        tlog(JSON.stringify(settings)), test_pointer = 0;
        var iRun = !1,
            dRun = !1,
            uRun = !1,
            pRun = !1,
            runNextTest = function() {
                if (5 != testStatus) {
                    if (test_pointer >= settings.test_order.length) return testStatus = 4, void sendTelemetry();
                    switch (settings.test_order.charAt(test_pointer)) {
                        case 'I':
                            if (test_pointer++, iRun) return void runNextTest();
                            iRun = !0, getIp(runNextTest);
                            break;
                        case 'D':
                            if (test_pointer++, dRun) return void runNextTest();
                            dRun = !0, testStatus = 1, dlTest(runNextTest);
                            break;
                        case 'U':
                            if (test_pointer++, uRun) return void runNextTest();
                            uRun = !0, testStatus = 3, ulTest(runNextTest);
                            break;
                        case 'P':
                            if (test_pointer++, pRun) return void runNextTest();
                            pRun = !0, testStatus = 2, pingTest(runNextTest);
                            break;
                        case '_':
                            test_pointer++, setTimeout(runNextTest, 1e3);
                            break;
                        default:
                            test_pointer++
                    }
                }
            };
        runNextTest()
    }
    'abort' === params[0] && (tlog('manually aborted'), clearRequests(), runNextTest = null, interval && clearInterval(interval), settings.telemetry_level > 1 && sendTelemetry(), testStatus = 5, dlStatus = '', ulStatus = '', pingStatus = '', jitterStatus = '')
});
var ipCalled = !1,
    dlCalled = !1,
    r = new ArrayBuffer(1048576);
try {
    r = new Float32Array(r);
    for (var i = 0; i < r.length; i++) r[i] = Math.random()
} catch (e) {}
for (var req = [], reqsmall = [], i = 0; 20 > i; i++) req.push(r);
req = new Blob(req), r = new ArrayBuffer(262144);
try {
    r = new Float32Array(r);
    for (var i = 0; i < r.length; i++) r[i] = Math.random()
} catch (e) {}
reqsmall.push(r), reqsmall = new Blob(reqsmall);
var ulCalled = !1,
    ptCalled = !1;