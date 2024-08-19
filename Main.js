const SHEET_USER_ID = "1XetoU8WbXkaS9ufh5rvlxaWU1tV1cYsxMWd7iNKqbUs";
const SHEET_USER_NAME = "user";
const CACHE_KEY = "infoReq";
const LOGIN_KEY = "payload";
const TODAY_TOKEN = "payloadToday";
const departments = [
  "สาขาวิชาการบัญชี",
  "สาขาวิชาการตลาด/ธุรกิจค้าปลีก",
  "สาขาวิชาเลขานุการ/การจัดการสำนักงาน",
  "สาขาวิชาสัมพันธ์ธุรกิจ",
  "สาขาวิชาการจัดการโลจิสติกส์",
  "สาขาวิชาคอมพิวเตอร์ธุรกิจ/เทคโนโลยีธุรกิจดิจิทัล",
  "สาขาวิชาเทคโนโลยีสารสนเทศ",
  "สาขาวิชาศิลปกรรม/กราฟิก",
  "สาขาวิชาผ้าและเครื่องแต่งกาย",
  "สาขาวิชาคหกรรมศาสตร์",
  "สาขาวิชาอาหารและโภชนาการ",
  "สาขาวิชาการโรงแรม",
  "สาขาวิชาการท่องเที่ยว",
  "สามัญสัมพันธ์",
  "บุคลากรทางการศึกษา",
];
const divisions = [
  "ฝ่ายวิชาการ",
  "ฝ่ายบริหารทรัพยากร",
  "ฝ่ายพัฒนากิจการนักเรียนนักศึกษา",
  "ฝ่ายแผนงานและความร่วมมือ",
];
const sDepartments = [
  "สาขาวิชาอาหารและโภชนาการ",
  "สาขาวิชาผ้าและเครื่องแต่งกาย",
  "สาขาวิชาการเลขานุการ",
  "การจัดการโลจิสติกส์",
  "สาขาสัมพันธ์ธุรกิจ",
  "สาขาการตลาด",
  "สาขาธุรกิจการบิน",
  "สาขาวิชาโรงแรมและการท่องเที่ยว",
  "สาขาวิชาศิลปกรรม/คอมพิวเตอร์กราฟิก",
  "สาขาวิชาคหกรรมศาสตร์",
  "วิชาสามัญสัมพันธ์",
];
const employeeDepartment = [
  "สาขาวิชาศิลปกรรม/กราฟิก",
  "สาขาวิชาอาหารและโภชนาการ",
  "สาขาวิชาการท่องเที่ยว",
  "สาขาวิชาการตลาด",
  "สาขาการจัดการทั่วไป",
  "สาขาวิชาสามัญสัมพันธ์",
  "สาขาคอมพิวเตอร์ธุรกิจและเทคโนโลยีสารสนเทศ",
  "สาขาการจัดการโลจิสติกส์",
  "สาขาวิชาการบัญชี",
  "บริหารงานทั่วไป (ด้านบริหารงานทั่วไป)",
];

const categories = [
  {
    title: "ครู",
    mode: "teacher",
    option: departments,
  },
  { title: "ครูพิเศษสอน", mode: "specailTeacher", option: sDepartments },
  { title: "ผู้บริหาร", mode: "manager", option: [] },
  { title: "พนักงานราชการ", mode: "employee", option: employeeDepartment },
  { title: "ครูต่างชาติ", mode: "foreignTeacher", option: [] },
  { title: "เจ้าหน้าที่", mode: "staff", option: divisions },
];
function doGet() {
  const html = HtmlService.createTemplateFromFile("Index").evaluate();
  html.setFaviconUrl(
    "https://upload.wikimedia.org/wikipedia/commons/c/c3/Udvc.imp.png"
  );

  html.setTitle("ระบบเช็คชื่อเข้าแถวบุคลากร");
  html.addMetaTag(
    "viewport",
    "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"
  );
  html.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  return html;
}

function include(fileName) {
  return HtmlService.createHtmlOutputFromFile(fileName).getContent();
}

function updateStatusBasedOnParameter(payload = "") {
  const dataEdit = JSON.parse(payload);
  if (dataEdit) {
    const { id, mode, updateData } = dataEdit;
    const ss = SpreadsheetApp.openById(id);
    let sheetName = "";
    switch (mode) {
      case "teacher":
        sheetName = "ครู";
        break;
      case "specailTeacher":
        sheetName = "ครูพิเศษสอน";
        break;
      case "employee":
        sheetName = "พนักงานราชการ";
        break;
      case "manager":
        sheetName = "ผู้บริหาร";
        break;
      case "foreignTeacher":
        sheetName = "ครูต่างชาติ";
        break;
      case "staff":
        sheetName = "เจ้าหน้าที่";
        break;
      default:
        break;
    }
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      return JSON.stringify({
        status: false,
        title: "ไม่พบชีทที่ต้องการอัปเดต❌.",
        message:
          "กรุณาตรวจสอบชีทที่ต้องการอัปเดตอีกครั้ง ว่าถูกลบหรือเกิดข้อผิดพลาดอะไรหรือไม่",
      });
    }
    const data = sheet.getDataRange().getValues();

    const updateMap = new Map(
      updateData.map((item) => [item.name, item.attend])
    );

    for (let i = 1; i < data.length; i++) {
      const name = data[i][1];
      if (updateMap.has(name)) {
        const newStatus = updateMap.get(name);
        const rowToUpdate = i + 1;
        sheet.getRange(rowToUpdate, 4).setValue(newStatus);
      }
    }
    return JSON.stringify({
      status: true,
      title: "อัปเดตข้อมูลสำเร็จ ✔.",
      message: "ท่านได้ทำการอัปเดตข้อมูลเรียบร้อยแล้ว",
    });
  }
}

function generateHTML(fileName) {
  return HtmlService.createHtmlOutputFromFile(fileName).getContent();
}

function filterSheetData(id, mode, conditions = "") {
  const ss = SpreadsheetApp.openById(id);
  const sheet = ss.getSheetByName(mode);
  const dataRange = sheet.getRange("A:D").getValues();
  const headers = dataRange[0];
  const data = dataRange.slice(1);
  const filteredData = data.filter((row) => {
    if (conditions === "all") {
      return row;
    } else if (conditions === "not-found") {
      return row[2] === conditions;
    } else if (conditions !== "all" && conditions !== "not-found") {
      return row[2] === conditions;
    }
  });
  const dataObjects = filteredData.map((row) => {
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    return obj;
  });

  return JSON.stringify(dataObjects);
}

function pageStack(page = "") {
  let headerFile = "";
  switch (page) {
    case "HomePage":
      headerFile = "HomeHeader";
      break;
    default:
      headerFile = "Header";
      break;
  }
  const header = HtmlService.createHtmlOutputFromFile(headerFile).getContent();
  const content = HtmlService.createHtmlOutputFromFile(page).getContent();
  return { header, content };
}
function getPageWithCategory(category) {
  const page = categories.find((item) => item.mode === category);
  if (page) {
    const options = getOptions(page.option, page.mode);
    const htmlString = getCheckinPage(page.title, page.mode, options);
    const content = HtmlService.createHtmlOutput(htmlString).getContent();
    const header = HtmlService.createHtmlOutputFromFile("Header").getContent();
    return { header, content };
  }
  return null;
}
