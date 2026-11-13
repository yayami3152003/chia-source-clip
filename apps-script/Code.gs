/**
 * Chia Source Clip — bản Google Apps Script.
 * Dán link thư mục Google Drive → xem hình từng clip → tự chia vào thư mục con ngay trên Drive.
 * Miễn phí, không cần Google Cloud hay Client ID.
 */

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Chia Source Clip')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function folderIdFrom_(link) {
  var s = String(link || '').trim();
  var m = s.match(/folders\/([A-Za-z0-9_-]{10,})/) || s.match(/[?&]id=([A-Za-z0-9_-]{10,})/);
  if (m) return m[1];
  return /^[A-Za-z0-9_-]{20,}$/.test(s) ? s : null;
}

/** Liệt kê clip nằm ngay trong thư mục. */
function listClips(link) {
  var id = folderIdFrom_(link);
  if (!id) throw new Error('LINK_SAI');
  var folder;
  try { folder = DriveApp.getFolderById(id); } catch (e) { throw new Error('KHONG_THAY_THU_MUC'); }
  var it = folder.getFiles(), out = [];
  while (it.hasNext()) {
    var f = it.next(), n = f.getName(), mt = f.getMimeType() || '';
    if (/^video\//.test(mt) || /\.(mp4|mov|m4v)$/i.test(n)) {
      out.push({ id: f.getId(), name: n, size: f.getSize(), created: f.getDateCreated().toISOString() });
    }
  }
  return { folderId: id, folderName: folder.getName(), clips: out };
}

/** Ảnh thu nhỏ (data URL), thời lượng và giờ quay của một clip. */
function inspectClip(id, size) {
  var token = ScriptApp.getOAuthToken();
  var thumb = null, dur = null, time = null;
  try {
    var r = UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files/' + id +
      '?fields=thumbnailLink,videoMediaMetadata(durationMillis)&supportsAllDrives=true',
      { headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true });
    if (r.getResponseCode() === 200) {
      var j = JSON.parse(r.getContentText());
      if (j.videoMediaMetadata && j.videoMediaMetadata.durationMillis) dur = Number(j.videoMediaMetadata.durationMillis) / 1000;
      if (j.thumbnailLink) {
        var t = UrlFetchApp.fetch(j.thumbnailLink.replace(/=s\d+$/, '=s400'),
          { headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true });
        if (t.getResponseCode() === 200) {
          thumb = 'data:' + (t.getBlob().getContentType() || 'image/jpeg') + ';base64,' + Utilities.base64Encode(t.getContent());
        }
      }
    }
  } catch (e) {}
  try { time = shotTime_(id, Number(size) || 0, token); } catch (e) {}
  return { thumb: thumb, time: time, dur: dur };
}

function readRange_(id, start, len, token) {
  var r = UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files/' + id + '?alt=media&supportsAllDrives=true', {
    headers: { Authorization: 'Bearer ' + token, Range: 'bytes=' + start + '-' + (start + len - 1) },
    muteHttpExceptions: true
  });
  var c = r.getResponseCode();
  if (c !== 206 && c !== 200) throw new Error('range ' + c);
  return r.getContent();
}

/** Giờ quay ghi trong file MP4/MOV (hộp mvhd). Chỉ đọc vài KB đầu từng hộp, không tải cả video. */
function shotTime_(id, size, token, reader) {
  var read = reader || function (s, l) { return readRange_(id, s, l, token); };
  function u32(b, i) { return (b[i] & 255) * 16777216 + ((b[i + 1] & 255) << 16) + ((b[i + 2] & 255) << 8) + (b[i + 3] & 255); }
  function typ(b, i) { return String.fromCharCode(b[i] & 255, b[i + 1] & 255, b[i + 2] & 255, b[i + 3] & 255); }
  var off = 0;
  for (var g = 0; g < 64 && off + 8 <= size; g++) {
    var h = read(off, Math.min(16, size - off));
    var sz = u32(h, 0), t = typ(h, 4), hdr = 8;
    if (sz === 1) { sz = u32(h, 8) * 4294967296 + u32(h, 12); hdr = 16; }
    else if (sz === 0) sz = size - off;
    if (sz < 8) break;
    if (t === 'moov') {
      var m = read(off, Math.min(sz, 8 * 1048576)), p = hdr;
      while (p + 8 <= m.length) {
        var s = u32(m, p);
        if (typ(m, p + 4) === 'mvhd') {
          var ver = m[p + 8] & 255;
          var secs = ver === 1 ? u32(m, p + 12) * 4294967296 + u32(m, p + 16) : u32(m, p + 12);
          var unix = secs - 2082844800;
          return (unix > 946684800 && unix < 4102444800) ? new Date(unix * 1000).toISOString() : null;
        }
        if (s < 8) break;
        p += s;
      }
      return null;
    }
    off += sz;
  }
  return null;
}

/** Tạo các thư mục con theo đường dẫn "Ngày 1/01 Ăn uống" bên trong thư mục gốc. */
function ensureFolders(rootId, paths) {
  var map = {}, created = [];
  paths.forEach(function (p) {
    var parentId = rootId, acc = '';
    p.split('/').forEach(function (seg) {
      acc += '/' + seg;
      if (!map[acc]) {
        var f = DriveApp.getFolderById(parentId).createFolder(seg);
        map[acc] = f.getId(); created.push(f.getId());
      }
      parentId = map[acc];
    });
  });
  var out = {};
  paths.forEach(function (p) { out[p] = map['/' + p]; });
  return { map: out, leafs: map, created: created };
}

/** Chuyển clip vào thư mục đích: [{id, to}]. */
function moveFiles(pairs) {
  pairs.forEach(function (x) { DriveApp.getFileById(x.id).moveTo(DriveApp.getFolderById(x.to)); });
  return pairs.length;
}

function writeList(rootId, text) {
  return DriveApp.getFolderById(rootId).createFile('_DANH-SACH-SOURCE.txt', text, MimeType.PLAIN_TEXT).getId();
}

function renameFolder(id, name) {
  DriveApp.getFolderById(id).setName(name);
  return true;
}

/** Hoàn tác: trả clip về thư mục gốc, đưa thư mục con đã tạo và file danh sách vào Thùng rác. */
function undoSort(rootId, fileIds, createdIds, listId) {
  var root = DriveApp.getFolderById(rootId);
  fileIds.forEach(function (id) { try { DriveApp.getFileById(id).moveTo(root); } catch (e) {} });
  createdIds.slice().reverse().forEach(function (id) { try { DriveApp.getFolderById(id).setTrashed(true); } catch (e) {} });
  if (listId) { try { DriveApp.getFileById(listId).setTrashed(true); } catch (e) {} }
  return true;
}
