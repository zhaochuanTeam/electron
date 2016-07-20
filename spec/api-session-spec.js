const assert = require('assert')
const http = require('http')
const path = require('path')
const fs = require('fs')

const {ipcRenderer, remote} = require('electron')
const {ipcMain, session, BrowserWindow} = remote

describe('session module', function () {
  this.timeout(10000)

  var fixtures = path.resolve(__dirname, 'fixtures')
  var w = null
  var url = 'http://127.0.0.1'

  beforeEach(function () {
    if (w != null) {
      w.destroy()
    }
    w = new BrowserWindow({
      show: false,
      width: 400,
      height: 400
    })
  })

  afterEach(function () {
    if (w != null) {
      w.destroy()
    }
    w = null
  })

  describe('session.defaultSession', function () {
    it('returns the default session', function () {
      assert.equal(session.defaultSession, session.fromPartition(''))
    })
  })

  describe('session.fromPartition(partition, options)', function () {
    it('returns existing session with same partition', function () {
      assert.equal(session.fromPartition('test'), session.fromPartition('test'))
    })

    it('created session is ref-counted', function () {
      const partition = 'test2'
      const userAgent = 'test-agent'
      const ses1 = session.fromPartition(partition)
      ses1.setUserAgent(userAgent)
      assert.equal(ses1.getUserAgent(), userAgent)
      ses1.destroy()
      const ses2 = session.fromPartition(partition)
      assert.notEqual(ses2.getUserAgent(), userAgent)
    })
  })

  describe('ses.cookies', function () {
    it('should get cookies', function (done) {
      var server = http.createServer(function (req, res) {
        res.setHeader('Set-Cookie', ['0=0'])
        res.end('finished')
        server.close()
      })
      server.listen(0, '127.0.0.1', function () {
        var port = server.address().port
        w.loadURL(url + ':' + port)
        w.webContents.on('did-finish-load', function () {
          w.webContents.session.cookies.get({
            url: url
          }, function (error, list) {
            var cookie, i, len
            if (error) {
              return done(error)
            }
            for (i = 0, len = list.length; i < len; i++) {
              cookie = list[i]
              if (cookie.name === '0') {
                if (cookie.value === '0') {
                  return done()
                } else {
                  return done('cookie value is ' + cookie.value + ' while expecting 0')
                }
              }
            }
            done('Can not find cookie')
          })
        })
      })
    })

    it('calls back with an error when setting a cookie with missing required fields', function (done) {
      session.defaultSession.cookies.set({
        url: '',
        name: '1',
        value: '1'
      }, function (error) {
        assert.equal(error.message, 'Setting cookie failed')
        done()
      })
    })

    it('should over-write the existent cookie', function (done) {
      session.defaultSession.cookies.set({
        url: url,
        name: '1',
        value: '1'
      }, function (error) {
        if (error) {
          return done(error)
        }
        session.defaultSession.cookies.get({
          url: url
        }, function (error, list) {
          var cookie, i, len
          if (error) {
            return done(error)
          }
          for (i = 0, len = list.length; i < len; i++) {
            cookie = list[i]
            if (cookie.name === '1') {
              if (cookie.value === '1') {
                return done()
              } else {
                return done('cookie value is ' + cookie.value + ' while expecting 1')
              }
            }
          }
          done('Can not find cookie')
        })
      })
    })

    it('should remove cookies', function (done) {
      session.defaultSession.cookies.set({
        url: url,
        name: '2',
        value: '2'
      }, function (error) {
        if (error) {
          return done(error)
        }
        session.defaultSession.cookies.remove(url, '2', function () {
          session.defaultSession.cookies.get({
            url: url
          }, function (error, list) {
            var cookie, i, len
            if (error) {
              return done(error)
            }
            for (i = 0, len = list.length; i < len; i++) {
              cookie = list[i]
              if (cookie.name === '2') {
                return done('Cookie not deleted')
              }
            }
            done()
          })
        })
      })
    })
  })

  describe('ses.clearStorageData(options)', function () {
    fixtures = path.resolve(__dirname, 'fixtures')
    it('clears localstorage data', function (done) {
      ipcMain.on('count', function (event, count) {
        ipcMain.removeAllListeners('count')
        assert(!count)
        done()
      })
      w.loadURL('file://' + path.join(fixtures, 'api', 'localstorage.html'))
      w.webContents.on('did-finish-load', function () {
        var options = {
          origin: 'file://',
          storages: ['localstorage'],
          quotas: ['persistent']
        }
        w.webContents.session.clearStorageData(options, function () {
          w.webContents.send('getcount')
        })
      })
    })
  })

  describe('will-download event', function () {
    var w = null

    beforeEach(function () {
      w = new BrowserWindow({
        show: false,
        width: 400,
        height: 400
      })
    })

    afterEach(function () {
      w.destroy()
    })

    it('can cancel default download behavior', function (done) {
      const mockFile = new Buffer(1024)
      const contentDisposition = 'inline; filename="mockFile.txt"'
      const downloadServer = http.createServer(function (req, res) {
        res.writeHead(200, {
          'Content-Length': mockFile.length,
          'Content-Type': 'application/plain',
          'Content-Disposition': contentDisposition
        })
        res.end(mockFile)
        downloadServer.close()
      })

      downloadServer.listen(0, '127.0.0.1', function () {
        const port = downloadServer.address().port
        const url = 'http://127.0.0.1:' + port + '/'

        ipcRenderer.sendSync('set-download-option', false, true)
        w.loadURL(url)
        ipcRenderer.once('download-error', function (event, downloadUrl, filename, error) {
          assert.equal(downloadUrl, url)
          assert.equal(filename, 'mockFile.txt')
          assert.equal(error, 'Object has been destroyed')
          done()
        })
      })
    })
  })

  describe('DownloadItem', function () {
    var mockPDF = new Buffer(1024 * 1024 * 5)
    var contentDisposition = 'inline; filename="mock.pdf"'
    var downloadFilePath = path.join(fixtures, 'mock.pdf')
    var downloadServer = http.createServer(function (req, res) {
      res.writeHead(200, {
        'Content-Length': mockPDF.length,
        'Content-Type': 'application/pdf',
        'Content-Disposition': contentDisposition
      })
      res.end(mockPDF)
      downloadServer.close()
    })
    var assertDownload = function (event, state, url, mimeType, receivedBytes, totalBytes, disposition, filename, port) {
      assert.equal(state, 'completed')
      assert.equal(filename, 'mock.pdf')
      assert.equal(url, 'http://127.0.0.1:' + port + '/')
      assert.equal(mimeType, 'application/pdf')
      assert.equal(receivedBytes, mockPDF.length)
      assert.equal(totalBytes, mockPDF.length)
      assert.equal(disposition, contentDisposition)
      assert(fs.existsSync(downloadFilePath))
      fs.unlinkSync(downloadFilePath)
    }

    it('can download using BrowserWindow.loadURL', function (done) {
      downloadServer.listen(0, '127.0.0.1', function () {
        var port = downloadServer.address().port
        ipcRenderer.sendSync('set-download-option', false, false)
        w.loadURL(url + ':' + port)
        ipcRenderer.once('download-done', function (event, state, url, mimeType, receivedBytes, totalBytes, disposition, filename) {
          assertDownload(event, state, url, mimeType, receivedBytes, totalBytes, disposition, filename, port)
          done()
        })
      })
    })

    it('can download using WebView.downloadURL', function (done) {
      downloadServer.listen(0, '127.0.0.1', function () {
        var port = downloadServer.address().port
        ipcRenderer.sendSync('set-download-option', false, false)
        var webview = new WebView()
        webview.src = 'file://' + fixtures + '/api/blank.html'
        webview.addEventListener('did-finish-load', function () {
          webview.downloadURL(url + ':' + port + '/')
        })
        ipcRenderer.once('download-done', function (event, state, url, mimeType, receivedBytes, totalBytes, disposition, filename) {
          assertDownload(event, state, url, mimeType, receivedBytes, totalBytes, disposition, filename, port)
          document.body.removeChild(webview)
          done()
        })
        document.body.appendChild(webview)
      })
    })

    it('can cancel download', function (done) {
      downloadServer.listen(0, '127.0.0.1', function () {
        var port = downloadServer.address().port
        ipcRenderer.sendSync('set-download-option', true, false)
        w.loadURL(url + ':' + port + '/')
        ipcRenderer.once('download-done', function (event, state, url, mimeType, receivedBytes, totalBytes, disposition, filename) {
          assert.equal(state, 'cancelled')
          assert.equal(filename, 'mock.pdf')
          assert.equal(mimeType, 'application/pdf')
          assert.equal(receivedBytes, 0)
          assert.equal(totalBytes, mockPDF.length)
          assert.equal(disposition, contentDisposition)
          done()
        })
      })
    })
  })

  describe('ses.protocol', function () {
    const partitionName = 'temp'
    const protocolName = 'sp'
    const partitionProtocol = session.fromPartition(partitionName).protocol
    const protocol = session.defaultSession.protocol
    const handler = function (ignoredError, callback) {
      callback({data: 'test', mimeType: 'text/html'})
    }

    beforeEach(function (done) {
      if (w != null) w.destroy()
      w = new BrowserWindow({
        show: false,
        webPreferences: {
          partition: partitionName
        }
      })
      partitionProtocol.registerStringProtocol(protocolName, handler, function (error) {
        done(error != null ? error : undefined)
      })
    })

    afterEach(function (done) {
      partitionProtocol.unregisterProtocol(protocolName, () => done())
    })

    it('does not affect defaultSession', function (done) {
      protocol.isProtocolHandled(protocolName, function (result) {
        assert.equal(result, false)
        partitionProtocol.isProtocolHandled(protocolName, function (result) {
          assert.equal(result, true)
          done()
        })
      })
    })

    xit('handles requests from partition', function (done) {
      w.webContents.on('did-finish-load', function () {
        done()
      })
      w.loadURL(`${protocolName}://fake-host`)
    })
  })
})
