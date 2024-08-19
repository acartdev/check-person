function isLoggedIn() {
  const userProps = PropertiesService.getUserProperties();
  if (userProps.getProperty(LOGIN_KEY) !== null) {
    return "login";
  } else {
    const payload = getPreviousEmail();
    if (payload) {
      return "pending";
    } else {
      return "logout";
    }
  }
}

function isEmailAuthorized(email) {
  const sheet = SpreadsheetApp.openById(SHEET_USER_ID);
  const emails = sheet.getRange("A:A").getValues().flat();
  if (emails) {
    emails.splice(0, 1);
    return emails.includes(email);
  } else {
    throw new Error("cnanot reade sheet file");
  }
}

function resendOTP() {
  const payload = getPreviousEmail();
  if (payload) {
    if (isEmailAuthorized(payload.email)) {
      const cache = CacheService.getUserCache();
      cache.remove(CACHE_KEY);
      const otp = generateOTP();
      sendOTP(payload.email, otp);
      cacheOTP(payload.email, otp);
    }
  }
  return {
    status: true,
    title: "ส่งรหัส OTP สำเร็จ📧.",
    message:
      "ระบบได้ส่งรหัส OTP ไปยัง Gmail ของท่านอีกครั้ง กรุณาตรวจสอบอีเมลของท่าน📥.",
    html: null,
  };
}

function getPreviousEmail() {
  const cache = CacheService.getUserCache();
  const storedOTP = cache.get(CACHE_KEY);
  const payload = JSON.parse(storedOTP);
  return payload || null;
}

function verifyOTP(userOTP) {
  const cache = CacheService.getUserCache();
  const storedOTP = cache.get(CACHE_KEY);
  const payload = JSON.parse(storedOTP);
  if (payload && payload.otp === userOTP) {
    cache.remove(CACHE_KEY);
    PropertiesService.getUserProperties().setProperty(LOGIN_KEY, payload.email);
    const html = HtmlService.createHtmlOutputFromFile("MainPage").getContent();
    return {
      status: true,
      title: "เข้าสู่ระบบสำเร็จ😊.",
      message:
        "ยินดีต้อนรับเข้าสู่ระบบเช็คชื่อบุคคลากรภายในวิทยาลัยอาชีวศึกษา อุดรธานี🏫.",
      html,
    };
  } else {
    return {
      status: false,
      title: "รหัส OTP ไม่ถูกต้อง❌.",
      message:
        "กรุณาตรวจสอบความถูกต้องของรหัส OTP ที่ระบบได้ส่งไปยัง Gmail ของท่านอีกครั้ง.",
      html: null,
    };
  }
}

function cacheOTP(email, otp) {
  const cache = CacheService.getUserCache();
  const payload = { email, otp };
  cache.put(CACHE_KEY, JSON.stringify(payload), 300); // Cache for 5 minutes (300 seconds)
}

function generateOTP() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let otp = "";
  for (let i = 0; i < 5; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    otp += characters[randomIndex];
  }
  return otp;
}
function sendOTP(email, otp) {
  const subject = "รหัส OTP สำหรับเข้าสู่ระบบเช็คชื่อเข้าแถวบุคคลากร";
  const body = `รหัส OTP ของคุณคือ: ${otp}. และจะหมดอายุใน 5 นาที`;
  GmailApp.sendEmail(email, subject, body);
}
function checkEmailAndSendOTP(email) {
  if (isEmailAuthorized(email)) {
    const otp = generateOTP();
    sendOTP(email, otp);
    cacheOTP(email, otp);
    const pinPage =
      HtmlService.createHtmlOutputFromFile("LoginPin").getContent();
    return {
      status: true,
      title: "เข้าสู่ระบบสำเร็จ✔",
      message: "ท่าได้ทำการเข้าสู่ระบบสำเร็จ ยินดีต้อนรับ🏫",
      html: pinPage,
    };
  } else {
    return {
      status: false,
      title: "บัญชีนี้ยังไม่ถูลงทะเบียนในระบบ❌",
      message:
        "กรุณาตรวจสอบความถูกต้องของ Gmail ของท่านอีกครั้ง หากมั่นใจว่าถูกต้องกรุณาแจ้งข้อผิดพลาดกับผู้ดูแลระบบ🙏.",
      html: null,
    };
  }
}

function logout() {
  PropertiesService.getUserProperties().deleteProperty(LOGIN_KEY);
  const html = HtmlService.createHtmlOutputFromFile("Login").getContent();

  return {
    status: true,
    title: "ออกจากระบบสำเร็จ👋.",
    message: "แล้วพบกันใหม่...",
    html,
  };
}
function setCacheWithExpiration(key, value) {
  const cache = CacheService.getScriptCache();
  const expirationInSeconds = 20 * 60 * 60; //20 hours
  cache.put(key, JSON.stringify(value), expirationInSeconds);
}
function getCachedData(key) {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(key);
  return cached ? JSON.parse(cached) : null;
}
