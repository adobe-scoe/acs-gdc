const FUNCTIONAL = 'Functional';
const CURRENT_DATE = new Date().getTime();
const CURRENT_DATA_TIME_MILLISECONDS = Date.now();

let pwdMap = {}
function initPwdMap(n) { n["Functional AEM Competency"] = "cW40ZXhtdG94NA==", n["Functional APAC Delivery"] = "M3Y3MGh1cXhpMw==", n["Functional CJM"] = "NDR4Z3MxNzVuaA==", n["Functional Commerce & PT"] = "bDdyeWNqbzEzYQ==", n["Functional Data"] = "cGI0Y3I4dWFndg==", n["Functional EA MSA SCOE & Workfront"] = "a3FiaDNhZDNsdA==", n["Functional SA UX Business Consulting"] = "djN0MW5xaDd2dw==", n["Functional UI Ultimate Support Sign"] = "aWVjdXMycW1zeQ==", n["Functional APAC Delivery"] = "dWI2enoxbjFkYw==", n["Functional EMEA Delivery"] = "cjB1czgxNGVzZA==", n["Functional NA Delivery"] = "bnJjdHprd2I5MQ==", n["Functional QA & Japan Delivery"] = "YnFxa3BmMXNlaw==", n["Functional RMO & Operations"] = "ZWd0NXdqZWNkdw==", n.AHM = "dG9lOGZ5eGY5YQ==" }


function createSelect(fd) {
  const select = document.createElement('select');
  select.id = fd.Field;
  select.addEventListener('change', hideShowFormFields);
  if (fd.Placeholder) {
    const ph = document.createElement('option');
    ph.textContent = fd.Placeholder;
    ph.setAttribute('selected', '');
    ph.setAttribute('disabled', '');
    select.append(ph);
  }
  fd.Options.split(',').forEach((o) => {
    const option = document.createElement('option');
    option.textContent = o.trim();
    option.value = o.trim();
    select.append(option);
  });
  if (fd.Mandatory === 'x') {
    select.setAttribute('required', 'required');
  }
  return select;
}

function constructPayload(form) {
  const payload = {};
  [...form.elements].forEach((fe) => {
    if (fe.type === 'checkbox') {
      if (fe.checked) payload[fe.id] = fe.value;
    } else if (fe.id) {
      payload[fe.id] = fe.value;
    }
  });
  return payload;
}

function authorized(form) {
  const payload = constructPayload(form);
  let category = payload.category;
  if (pwdMap[category] === btoa(payload.password)) {
    return true;
  } else {
    return false;
  }
}

async function submitForm(form) {
  const payload = constructPayload(form);
  const resp = await fetch(form.dataset.action, {
    method: 'POST',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data: payload }),
  });
  await resp.text();
  return payload;
}

function createButton(fd, nominationOpen) {
  console.debug('nomination open -  ', nominationOpen)
  const button = document.createElement('button');
  button.textContent = fd.Label;
  button.classList.add('button');
  if (fd.Type === 'submit') {
    button.setAttribute('name', 'btnSubmit');
    button.addEventListener('click', async (event) => {
      const form = button.closest('form');
      if (form.checkValidity() && authorized(form)) {
        event.preventDefault();
        button.setAttribute('disabled', '');
        await submitForm(form);
        const redirectTo = fd.Extra;
        window.location.href = redirectTo;
      } else {
        event.preventDefault();
        alert("Invalid Password!!!");
      }
    });
    if (!nominationOpen) {
      button.setAttribute('disabled', '');
    }
  }
  return button;
}

function createHeading(fd) {
  const heading = document.createElement('h3');
  heading.textContent = fd.Label;
  return heading;
}

function createInput(fd) {
  const input = document.createElement('input');
  input.type = fd.Type;
  input.id = fd.Field;
  input.setAttribute('placeholder', fd.Placeholder);
  input.setAttribute('class', fd.Style);
  if (fd.Mandatory === 'x') {
    input.setAttribute('required', 'required');
  }
  if (fd.Field === 'recordId') {
    input.setAttribute('value', CURRENT_DATA_TIME_MILLISECONDS);
  }
  return input;
}

function createTextArea(fd) {
  const input = document.createElement('textarea');
  input.id = fd.Field;
  input.setAttribute('placeholder', fd.Placeholder);
  if (fd.Mandatory === 'x') {
    input.setAttribute('required', 'required');
  }
  return input;
}

function createLabel(fd) {
  const label = document.createElement('label');
  label.setAttribute('for', fd.Field);
  label.textContent = fd.Label;
  if (fd.Mandatory === 'x') {
    label.classList.add('required');
  }
  return label;
}

function applyRules(form, rules) {
  const payload = constructPayload(form);
  rules.forEach((field) => {
    const { type, condition: { key, operator, value } } = field.rule;
    if (type === 'visible') {
      if (operator === 'eq') {
        if (payload[key] === value) {
          form.querySelector(`.${field.fieldId}`).classList.remove('hidden');
        } else {
          form.querySelector(`.${field.fieldId}`).classList.add('hidden');
        }
      }
    }
  });
}

function hideShowFormFields(e) {
  if (e.target.id != "category" && e.target.id != "award") {
    return;
  }
  if (e.target.id == "category") {
    var selectedValue = e.target.value;
    var awards = document.getElementById("award");

    for (var i = awards.options.length; i--;) {
      awards.removeChild(awards.options[i]);
    }
    let value = selectedValue;
    if (selectedValue.startsWith(FUNCTIONAL)) {
      //value = selectedValue.substr("Functional".length + 1,selectedValue.length);
      value = FUNCTIONAL;
      document.getElementsByClassName('form-teamMembers-wrapper')[0].setAttribute('hidden', '');
    } else if (selectedValue.startsWith("Rockstars")) {
      document.getElementsByClassName('form-teamMembers-wrapper')[0].setAttribute('hidden', '');
    }
    let entry = getFilteredAwardCategories(records.data, value);
    entry.options.split(',').forEach((o) => {
      const option = document.createElement('option');
      option.textContent = o.trim();
      option.value = o.trim();
      awards.append(option);
    });
    showHideSubmitButton(entry);
  } else if (e.target.id == "award") {
    if (e.target.value == "Team Awards") {
      document.getElementsByClassName('form-empLdap-wrapper')[0].setAttribute('hidden', '');
      document.getElementsByClassName('form-empId-wrapper')[0].setAttribute('hidden', '');
      document.getElementsByClassName('form-empTitle-wrapper')[0].setAttribute('hidden', '');
      document.getElementsByClassName('form-acsFunction-wrapper')[0].setAttribute('hidden', '');
      document.getElementsByClassName('form-teamMembers-wrapper')[0].removeAttribute('hidden');
    } else {
      document.getElementsByClassName('form-empLdap-wrapper')[0].removeAttribute('hidden');
      document.getElementsByClassName('form-empId-wrapper')[0].removeAttribute('hidden');
      document.getElementsByClassName('form-empTitle-wrapper')[0].removeAttribute('hidden');
      document.getElementsByClassName('form-acsFunction-wrapper')[0].removeAttribute('hidden');
      document.getElementsByClassName('form-teamMembers-wrapper')[0].setAttribute('hidden', '');
    }
  }
}

function getFilteredAwardCategories(records, key) {
  let object = {};
  records.filter(function (e) {
    if (e.category == key) {
      object = e;
      console.debug(e)
    }
  });
  return object;
}

function showHideSubmitButton(configEntry) {
  const endDate = excelDateToJSDate(configEntry.endDate);
  const startDate = excelDateToJSDate(configEntry.startDate);
  let btnSubmit = document.getElementsByName('btnSubmit')[0];
  if (CURRENT_DATE >= startDate.getTime() && CURRENT_DATE <= endDate.getTime()) {
    btnSubmit.removeAttribute('disabled');
    btnSubmit.classList.remove('disabledButton');
    btnSubmit.classList.contains('button') ? '' : btnSubmit.classList.add('button');
  } else {
    btnSubmit.setAttribute('disabled', '');
    btnSubmit.classList.remove('button');
    btnSubmit.classList.add('disabledButton')
  }
}
function excelDateToJSDate(serial) {
  let utc_days = Math.floor(serial - 25569);
  let utc_value = utc_days * 86400;
  let date_info = new Date(utc_value * 1000);/* ā */
  let fractional_day = serial - Math.floor(serial) + 0.0000001;
  let total_seconds = Math.floor(86400 * fractional_day);
  let seconds = total_seconds % 60;
  total_seconds -= seconds;
  let hours = Math.floor(total_seconds / (60 * 60));
  let minutes = Math.floor(total_seconds / 60) % 60;
  return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);

}

function showNominationStatus(records) {
  var formInfoDom = document.createElement('div');
  records.data.forEach((record) => {
    let nominationEndDate = excelDateToJSDate(record.endDate);
    let nominationStartDate = excelDateToJSDate(record.startDate);
    var nominationInfo = document.createElement('p');
    if (CURRENT_DATE >= nominationStartDate.getTime() && CURRENT_DATE <= nominationEndDate.getTime()) {
      nominationInfo.textContent = 'Nominations are open for ' + record.category + ' until ' + nominationEndDate.toDateString();
      nominationInfo.style.color = 'green';
    } else if (CURRENT_DATE < nominationStartDate.getTime() && CURRENT_DATE < nominationEndDate.getTime()) {
      nominationInfo.textContent = 'Nomination will start for ' + record.category + ' from ' + nominationEndDate.toDateString();
      nominationInfo.style.color = 'orange';
    } else if (CURRENT_DATE > nominationStartDate.getTime() && CURRENT_DATE > nominationEndDate.getTime()) {
      nominationInfo.textContent = 'Nomination has been closed for ' + record.category + ' on ' + nominationEndDate.toDateString();
      nominationInfo.style.color = 'red';
    }
    formInfoDom.append(nominationInfo);
  })
  return formInfoDom;
}
let records = {}
async function createForm(formURL) {
  console.debug('inside create form path :', formURL)

  var nominationOpen = false;
  const { pathname } = new URL(formURL);
  const checkValidityFormURL = formURL + "?sheet=config";
  const { configpath } = new URL(checkValidityFormURL);
  //const validityResp = await fetch(configpath);
  // const validityjson = await validityResp.json();
  console.debug(checkValidityFormURL);
  const validityresp = await fetch(checkValidityFormURL, { cache: 'no-cache', mode: 'cors' });
  records = await validityresp.json();

  const resp = await fetch(pathname);
  const json = await resp.json();
  const form = document.createElement('form');
  form.append(showNominationStatus(records));
  const rules = [];
  console.debug(json)
  // eslint-disable-next-line prefer-destructuring
  form.dataset.action = pathname.split('.json')[0];
  let submitWrapper;
  json.data.forEach((fd) => {
    fd.Type = fd.Type || 'text';
    const fieldWrapper = document.createElement('div');
    const style = fd.Style ? ` form-${fd.Style}` : '';
    const fieldId = `form-${fd.Field}-wrapper${style}`;
    fieldWrapper.className = fieldId;
    fieldWrapper.classList.add('field-wrapper');
    switch (fd.Type) {
      case 'select':
        console.debug(fd.Field);
        fieldWrapper.append(createLabel(fd));
        fieldWrapper.append(createSelect(fd));
        break;
      case 'heading':
        fieldWrapper.append(createHeading(fd));
        break;
      case 'checkbox':
        fieldWrapper.append(createInput(fd));
        fieldWrapper.append(createLabel(fd));
        break;
      case 'hidden':
        fieldWrapper.append(createInput(fd));
        break;
      case 'text-area':
        fieldWrapper.append(createLabel(fd));
        fieldWrapper.append(createTextArea(fd));
        break;
      case 'submit':
        fieldWrapper.append(createButton(fd, nominationOpen));
        submitWrapper = fieldWrapper;
        break;
      case 'reset':
        submitWrapper.append(createInput(fd));
        break;
      default:
        fieldWrapper.append(createLabel(fd));
        fieldWrapper.append(createInput(fd));
    }

    if (fd.Rules) {
      try {
        rules.push({ fieldId, rule: JSON.parse(fd.Rules) });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(`Invalid Rule ${fd.Rules}: ${e}`);
      }
    }
    form.append(fieldWrapper);
  });

  form.addEventListener('change', () => applyRules(form, rules));
  applyRules(form, rules);
  return (form);
}

export default async function decorate(block) {
  const form = block.querySelector('a[href$=".json"]');
  if (form) {
    initPwdMap(pwdMap);
    form.replaceWith(await createForm(form.href));
  }
}
