function getFolderFilesSortedByDate() {
  const destinationFolder = "1OmC3bw6TllRpvUnge1cU1m_y_9Xi2hFx";
  const folder = DriveApp.getFolderById(destinationFolder);
  const files = folder.getFiles();
  const fileArray = [];
  while (files.hasNext()) {
    const file = files.next();
    const fileObject = {
      id: file.getId(),
      name: file.getName(),
      dateCreated: file.getDateCreated(),
      dateUpdated: file.getLastUpdated(),
      size: file.getSize(),
      mimeType: file.getMimeType(),
      url: file.getUrl(),
    };

    if (file.getMimeType() === MimeType.GOOGLE_SHEETS) {
      const counts = countColumnDValuesAllSheets(file.getId());
      fileObject.participantCount = counts.participantCount;
      fileObject.nonParticipantCount = counts.nonParticipantCount;
    }

    fileArray.push(fileObject);
  }

  fileArray.sort(function (a, b) {
    return b.dateUpdated - a.dateUpdated;
  });
  return JSON.stringify(fileArray);
}

function copySheetAndAddDate() {
  const CURRENT_SHEET_ID = getCachedData(TODAY_TOKEN);
  if (CURRENT_SHEET_ID) {
    return {
      status: false,
      title: "ท่านได้ใช้สิทธิเช็คชื่อวันนี้หมดแล้ว❌.",
      message:
        "ท่านได้ทำการเช็คชื่อเรียบร้อยแล้ว กรุณาตรวจสอบข้อมูล ณ วันที่ปัจจุบันที่หน้าหลัก",
    };
  }
  const sourceFileId = "1EdJKxbbSAYfHT6tsi9LFB3myncyK_VgFse27WiHBEzA";
  const destinationFolderId = "1OmC3bw6TllRpvUnge1cU1m_y_9Xi2hFx";
  const newFileName = formatThaiDate(new Date());
  const newFile = DriveApp.getFileById(sourceFileId).makeCopy(newFileName);
  const destinationFolder = DriveApp.getFolderById(destinationFolderId);
  destinationFolder.addFile(newFile);
  DriveApp.getRootFolder().removeFile(newFile);
  const newSpreadsheet = SpreadsheetApp.open(newFile);
  const currentDate = new Date().toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
  const sheets = newSpreadsheet.getSheets();
  for (let i = 0; i < sheets.length; i++) {
    const sheet = sheets[i];
    const lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      const range = sheet.getRange("A2:A" + lastRow);
      const values = range.getValues();
      for (let j = 0; j < values.length; j++) {
        values[j][0] = currentDate;
      }
      range.setValues(values);
    }
  }
  setCacheWithExpiration(TODAY_TOKEN, newFile.getId());
  return { status: true, message: "จัดเตรียมข้อมูลสำเร็จ" };
}
function renameSheet(fileId = "", newName) {
  try {
    let id = "";
    if (fileId) {
      id = fileId;
    } else {
      id = getCachedData(TODAY_TOKEN);
    }
    var file = DriveApp.getFileById(id);
    file.setName(newName);
    return {
      status: true,
      title: "บันทึกวันหยุดสำเร็จ✔",
      message:
        "ท่านได้ทำการบันทึกวันหยุดเรียบร้อยแล้ว กรุณาตรวจสอบข้อมูลที่หน้าหลัก",
    };
  } catch (e) {
    return {
      status: false,
      title: "บันทึกวันหยุดไม่สำเร็จ❌",
      message:
        "เกิดข้อผิดพลาดในการบันทึกวันหยุด กรุณาตรวจสอบข้อมูลอีกครั้ง หรืออาจมีข้อผิดพลาดในเชิงเทคนิค",
    };
  }
}
function formatThaiDate(date) {
  const thaiDays = [
    "อาทิตย์",
    "จันทร์",
    "อังคาร",
    "พุธ",
    "พฤหัสบดี",
    "ศุกร์",
    "เสาร์",
  ];
  const thaiMonths = [
    "ม.ค.",
    "ก.พ.",
    "มี.ค.",
    "เม.ย.",
    "พ.ค.",
    "มิ.ย.",
    "ก.ค.",
    "ส.ค.",
    "ก.ย.",
    "ต.ค.",
    "พ.ย.",
    "ธ.ค.",
  ];

  const dayOfWeek = thaiDays[date.getDay()];
  const dayOfMonth = date.getDate();
  const month = thaiMonths[date.getMonth()];
  const year = date.getFullYear() + 543; // แปลงเป็นปี พ.ศ.
  const shortYear = (year % 100).toString().padStart(2, "0");

  return `วัน${dayOfWeek} ที่ ${dayOfMonth} ${month} ${shortYear}`;
}

function countColumnDValuesAllSheets(fileId) {
  const spreadsheet = SpreadsheetApp.openById(fileId);
  const sheets = spreadsheet.getSheets();
  let totalParticipantCount = 0;
  let totalNonParticipantCount = 0;

  for (let i = 0; i < sheets.length; i++) {
    const sheet = sheets[i];
    const dataRange = sheet.getRange("D2:D" + sheet.getLastRow());
    const values = dataRange.getValues();

    for (let j = 0; j < values.length; j++) {
      const cellValue = values[j][0];
      if (cellValue === "เข้าร่วม") {
        totalParticipantCount++;
      } else if (cellValue === "ไม่เข้าร่วม") {
        totalNonParticipantCount++;
      }
    }
  }

  return {
    participantCount: totalParticipantCount,
    nonParticipantCount: totalNonParticipantCount,
  };
}
