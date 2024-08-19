const getOptions = (data = [], mode) => {
  let optionTitle = "";
  switch (mode) {
    case "teacher":
    case "specailTeacher":
    case "employee":
      optionTitle = "เลือกสาขาวิชา";
      break;
    case "manager":
    case "foreignTeacher":
      optionTitle = "ไม่รองรับการใช้งาน";
      break;
    case "staff":
      optionTitle = "เลือกฝ่ายงาน";
      break;
  }

  let prefix = `<option selected  class="text-color">--${optionTitle}--</option>\n`;
  if (data.length > 0) {
    prefix += data.map((item) => {
      return `<option value="${item}" class="text-color">${item}</option>\n`;
    });
  }
  return prefix;
};
function getCheckinPage(title, mode, option) {
  const CURRENT_SHEET_ID = getCachedData(TODAY_TOKEN);
  let isSelect = false;
  switch (mode) {
    case "teacher":
    case "specailTeacher":
    case "employee":
    case "staff":
      isSelect = true;
      break;
    case "foreignTeacher":
    case "manager":
      isSelect = false;
      break;
  }
  const html = `
  <div class="container-sm" style="max-width:768px">
      <div class="d-grid px-1">
        <div class="row" style="border-bottom: 1px solid var(--primary-color)">
          <div class="col">
            <p class="m-0 text-color fs-3" >${title}</p>
          </div>
          <div class="col"></div>
        </div>
        <div class="row mt-3 align-items-baseline">
          <div class="col-4 px-0 ps-1">
            <p class="m-0 text-color" style="font-size: 0.8em" id="showDate"></p>
          </div>
          <div class="col">
            <div class="select-wrapper">
              <select
                ${isSelect ? "" : "disabled"}
                style="
                  height: 2em;
                  max-width: 90%;
                  border: 1px solid var(--primary-color);
                  border-radius: 8px;
                "
                id="options"
                class="form-select mx-auto form-select-sm text-color w-100"
                aria-label="Small select example"
              >
              ${option}
              </select>
            </div>
          </div>
        </div>
        <div class="row h-100">
          <div class="col">
            <div class="row" style="border-bottom: 1px solid var(--primary-color)">
              <div class="col text-start text-color fs-5">รายชื่อ</div>
              <div class="col-6">
                <div class="row">
                  <div class="col-6 text-color text-end fs-6">เข้าร่วม</div>
                  <div class="col-6 text-color text-end fs-6">ไม่เข้าร่วม</div>
                </div>
              </div>
            </div>
            <form class="row" id="userList">
  
            </form>
          </div>
        </div>
      </div>
      <div class="position-fixed" style="right: 1em; bottom: 2em">
        <button id="submitCheck" class="btn btn-primary" style="border-radius: 30px">
          <span class="d-flex align-items-center justify-content-center gap-2">
            บันทึก<i
              style="font-size: 1.3em"
              class="fa-solid fa-user-check text-white"
            ></i
          ></span>
        </button>
      </div>
    </div>
    <script>
      $(document).ready(function () {
        const PREV_SHEET = "prev_sheet";
        let id = "${CURRENT_SHEET_ID}";
        const prevId = sessionStorage.getItem(PREV_SHEET);
        if(prevId) {
          id = prevId;
        }
        const searchParams ="${isSelect ? "not-found" : "all"}"
        const notFound = '<div class="col text-center fs-2 mt-5 text-color">ไม่พบข้อมูลผู้ใช้...</div>';
        $("#loading").show();
        google.script.run.withSuccessHandler(function (res) {
          const data = JSON.parse(res);
            if(data.length > 0){
            const htmlUser =  generateUserList(data);
            $("#userList").html(htmlUser);
              $("#loading").hide();
            }else{
             $("#userList").html(notFound);
             $("#loading").hide();
            }
          }).filterSheetData(id,"${title}",searchParams);
        const MODE = "${mode}";
        $("#submitCheck").click(function (e) {
          e.preventDefault();
          $("#userList").submit();
        });
        $("#userList").on('submit',function (e) {
          e.preventDefault();
          $("#loading").show();
          const formData = new FormData(e.target);
          const formArray = [];
          formData.forEach((value, key) => {
            const [field, index] = key.split('-');
            if (!formArray[index]) {
              formArray[index] = {};
            }
            formArray[index][field] = value;
          });
          if(formArray.length > 0){
            const data = {
              id: id,
              mode: MODE,
              updateData: formArray
            }
            const payload = JSON.stringify(data);
            google.script.run.withSuccessHandler(function (res) {
              const response = JSON.parse(res);
              if(response.status){
                  $("#statusModal").modal("show");
                  $("#statusModalTitle").text(response.title);
                  $("#statusModalDesc").html(response.message);
                  $("#btnStatus").addClass("btn-success");
              }else{
                  $("#statusModal").modal("show");
                  $("#statusModalTitle").text(response.title);
                  $("#statusModalDesc").html(response.message);
                  $("#btnStatus").addClass("btn-danger");
              }
              $("#loading").hide();
            }).updateStatusBasedOnParameter(payload); 
          }
        });
        dayjs.locale("th");
        dayjs.extend(window.dayjs_plugin_buddhistEra);
        $("#showDate").text(formatThaiDate(new Date()));
        $("#options").change(function () {
          $("#loading").show();
          const value = $(this).val();
          google.script.run.withSuccessHandler(function (res) {
            const data = JSON.parse(res);
            if(data.length > 0){
            const htmlUser =  generateUserList(data);
            $("#userList").html(htmlUser);
              $("#loading").hide();
            }else{
             $("#userList").html(notFound);
             $("#loading").hide();
            }
          }).filterSheetData(id,"${title}",value);
          
        });
        $("input:checkbox").on('click', function() {
          const $box = $(this);
          if ($box.is(":checked")) {
            const group = "input:checkbox[name='" + $box.attr("name") + "']";
            $(group).prop("checked", false);
            $box.prop("checked", true);
          } else {
            $box.prop("checked", false);
          }
        });
      });
      function formatThaiDate(date) {
        return dayjs(date).format("วันdddd ที่ D MMM BB");
      }
      function generateUserList(data) {
        let html = "";
        data.forEach((item,index) => {
          let userHTML = "";
          userHTML += \`<div class="col-12 mt-3" style="border-bottom: 1px solid var(--secon-color)">\`;
          userHTML += \`<div class="row">\`;
          userHTML += \`<input readonly type="text" class="col" style="border:none; font-size:0.9em; color:var(--primary-color)" value="\${item['รายชื่อ']}" name="name-\${index}" />\`;
          userHTML += \`<div class="col-6">\`;
          userHTML += \`<div class="row">\`;
          userHTML += \`<div class="col-6 text-color text-end fs-6">\`;
          userHTML += \`<label class="custom-checkbox me-4"><input \${item['กิจกรรม'] === "เข้าร่วม" ? "checked" : ""}  name="attend-\${index}" onclick="toggleCheckbox(this)" type="checkbox" value="เข้าร่วม"><span class="checkmark"></span></label>\`;   
          userHTML += \`</div>\`;
          userHTML += \`<div class="col-6 text-color text-end fs-6">\`;
          userHTML += \`<label class="custom-checkbox me-4"><input \${item['กิจกรรม'] === "ไม่เข้าร่วม" ? "checked" : ""}  name="attend-\${index}" onclick="toggleCheckbox(this)" type="checkbox" value="ไม่เข้าร่วม"><span class="checkmark"></span></label>\`;
          userHTML += \`</div>\`;
          userHTML += \`</div>\`;
          userHTML += \`</div>\`;
          userHTML += \`</div>\`;
          userHTML += \`</div>\`;
          html += userHTML;
        });
        return html;
      }
      function toggleCheckbox(element) {
        const checkboxes = document.getElementsByName(element.name);
        checkboxes.forEach((checkbox) => {
          if (checkbox !== element) checkbox.checked = false;
        });
      }
    </script>
    `;
  return html;
}
