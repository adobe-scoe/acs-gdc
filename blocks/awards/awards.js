/*
 * tabs - consonant v6
 * https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/Tab_Role
 */

import { getLibs } from '../../scripts/utils.js';

const { createTag } = await import(`${getLibs()}/utils/utils.js`);
var excelData;
const isElementInContainerView = (targetEl) => {
  const rect = targetEl.getBoundingClientRect();
  const docEl = document.documentElement;
  return (
    rect.top >= 0
    && rect.left >= 0
    && rect.bottom <= (window.innerHeight || /* c8 ignore next */ docEl.clientHeight)
    && rect.right <= (window.innerWidth || /* c8 ignore next */ docEl.clientWidth)
  );
};

const scrollTabIntoView = (e) => {
  const isElInView = isElementInContainerView(e);
  /* c8 ignore next */
  if (!isElInView) e.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
};

function changeTabs(e) {
  if (excelData == undefined) {
    setTimeout(function () {
      changeTabs(e);
    }, 100);
  }
  else {
    const { target } = e;
    let awardsTitle = target.textContent;
    let winnerFilter = { "Quarter": "Q1", "Status (Approved/Winner)": "Winner", "Award Title-": awardsTitle };
    let quarterWinnerData = getFilteredData(excelData, winnerFilter);
    let nomineeFilter = { "Quarter": "Q1", "Status (Approved/Winner)": "Nominated", "Award Title-": awardsTitle };
    let quarterNomineeData = getFilteredData(excelData, nomineeFilter);
    const parent = target.parentNode;
    const grandparent = parent.parentNode.nextElementSibling;
    parent
      .querySelectorAll('[aria-selected="true"]')
      .forEach((t) => t.setAttribute('aria-selected', false));
    target.setAttribute('aria-selected', true);
    scrollTabIntoView(target);
    grandparent
      .querySelectorAll('[role="tabpanel"]')
      .forEach((p) => p.setAttribute('hidden', true));
    let tabPanel = grandparent.parentNode.querySelector(`#${target.getAttribute('aria-controls')}`);
    tabPanel.innerHTML = createResultDiv(quarterWinnerData, quarterNomineeData);
    tabPanel.removeAttribute('hidden');
  }
}

function getStringKeyName(str) {
  /*
  The [^...] character class is used to match any character that is not a valid CSS selector character.
  The \p{L} and \p{N} Unicode properties are used to match any letter or digit character in any language.
  */
  const regex = /[^\p{L}\p{N}_-]/gu;
  return str.trim().toLowerCase().replace(/\s+/g, '-').replace(regex, '');
}

function getUniqueId(el, rootElem) {
  const tabs = rootElem.querySelectorAll('.tabs');
  return [...tabs].indexOf(el) + 1;
}

function configTabs(config, rootElem) {
  if (config['active-tab']) {
    const id = `#tab-${CSS.escape(config['tab-id'])}-${CSS.escape(getStringKeyName(config['active-tab']))}`;
    const sel = rootElem.querySelector(id);
    if (sel) sel.click();
  }
}

function initTabs(elm, config, rootElem) {
  const tabs = elm.querySelectorAll('[role="tab"]');
  const tabLists = elm.querySelectorAll('[role="tablist"]');
  tabLists.forEach((tabList) => {
    let tabFocus = 0;
    tabList.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        if (e.key === 'ArrowRight') {
          tabFocus += 1;
          /* c8 ignore next */
          if (tabFocus >= tabs.length) tabFocus = 0;
        } else if (e.key === 'ArrowLeft') {
          tabFocus -= 1;
          /* c8 ignore next */
          if (tabFocus < 0) tabFocus = tabs.length - 1;
        }
        tabs[tabFocus].setAttribute('tabindex', 0);
        tabs[tabFocus].focus();
      }
    });
  });
  tabs.forEach((tab) => {
    tab.addEventListener('click', changeTabs);
  });
  if (config) configTabs(config, rootElem);
}

const handleDeferredImages = (block) => {
  const loadLazyImages = () => {
    const images = block.querySelectorAll('img[loading="lazy"]');
    images.forEach((img) => {
      /* c8 ignore next */
      img.removeAttribute('loading');
    });
  };
  document.addEventListener('milo:deferred', loadLazyImages, { once: true, capture: true });
}

const init = (block) => {
  const rootElem = block.closest('.fragment') || document;
  const rows = block.querySelectorAll(':scope > div');
  const parentSection = block.closest('.section');
  /* c8 ignore next */
  if (!rows.length) return;

  // Tab Config
  const config = {};
  const configRows = [...rows];
  configRows.splice(0, 1);
  configRows.forEach((row) => {
    const rowKey = getStringKeyName(row.children[0].textContent);
    const rowVal = row.children[1].textContent.trim();
    config[rowKey] = rowVal;
    row.remove();
  });
  const tabId = config.id || getUniqueId(block, rootElem);
  config['tab-id'] = tabId;
  block.id = `tabs-${tabId}`;
  parentSection?.classList.add(`tablist-${tabId}-section`);

  // Tab Content
  const tabContentContainer = createTag('div', { class: 'tab-content-container' });
  const tabContent = createTag('div', { class: 'tab-content' }, tabContentContainer);
  block.append(tabContent);

  // Tab List
  const tabList = rows[0];
  tabList.classList.add('tabList');
  tabList.setAttribute('role', 'tablist');
  const tabListContainer = tabList.querySelector(':scope > div');
  tabListContainer.classList.add('tab-list-container');
  const tabListItems = rows[0].querySelectorAll(':scope li');
  if (tabListItems) {
    const btnClass = [...block.classList].includes('quiet') ? 'heading-xs' : 'heading-xs';
    tabListItems.forEach((item, i) => {
      const tabName = config.id ? i + 1 : getStringKeyName(item.textContent);
      const tabBtnAttributes = {
        role: 'tab',
        class: btnClass,
        id: `tab-${tabId}-${tabName}`,
        tabindex: '0',
        'aria-selected': (i === 0) ? 'true' : 'false',
        'aria-controls': `tab-panel-${tabId}-${tabName}`,
      };
      const tabBtn = createTag('button', tabBtnAttributes);
      tabBtn.innerText = item.textContent;
      tabListContainer.append(tabBtn);

      const tabContentAttributes = {
        id: `tab-panel-${tabId}-${tabName}`,
        role: 'tabpanel',
        class: 'tabpanel',
        tabindex: '0',
        'aria-labelledby': `tab-${tabId}-${tabName}`,
      };
      const tabListContent = createTag('div', tabContentAttributes);
      tabListContent.setAttribute('aria-labelledby', `tab-${tabId}-${tabName}`);
      if (i > 0) tabListContent.setAttribute('hidden', '');
      tabContentContainer.append(tabListContent);
    });
    tabListItems[0].parentElement.remove();
  }

  // Tab Sections
  const allSections = Array.from(rootElem.querySelectorAll('div.section'));
  allSections.forEach((e, i) => {
    const sectionMetadata = e.querySelector(':scope > .section-metadata');
    if (!sectionMetadata) return;
    const rows = sectionMetadata.querySelectorAll(':scope > div');
    rows.forEach((row) => {
      const key = getStringKeyName(row.children[0].textContent);
      if (key == 'path') {
        fetchData(row.children[1].textContent);
      }
      if (key !== 'tab') return;
      let val = getStringKeyName(row.children[1].textContent);
      if (!val) return;
      let id = tabId;
      let assocTabItem = rootElem.querySelector(`#tab-panel-${id}-${val}`);
      if (config.id) {
        const values = row.children[1].textContent.split(',');
        id = values[0];
        val = getStringKeyName(String(values[1]));
        assocTabItem = rootElem.getElementById(`tab-panel-${id}-${val}`);
      }
      if (assocTabItem) {
        const section = sectionMetadata.closest('.section');
        assocTabItem.append(section);
      }
    });
  });
  handleDeferredImages(block);
  initTabs(block, config, rootElem);
};
async function fetchData(path) {
  const response = await fetch(path);
  const jsonData = await response.json();
  excelData = jsonData.data;
  excelData.shift();
}

function getFilteredData(data, filterName) {
  for (let [key, value] of Object.entries(filterName)) {
    data = data.filter(function (entry) {
      return entry[key] === value;
    });
  }
  return data;
}

function createResultDiv(quarterWinnerData, quarterNomineeData) {
  let content = "";
  if (quarterWinnerData.length) {
    let winnerData = quarterWinnerData ? quarterWinnerData[0] : {};
    let nomineeContent = "";
    for (let nomineeData of quarterNomineeData) {
      nomineeContent += createNomineeDiv(nomineeData);
    }
    let nomineeSection = quarterNomineeData.length ? "<h4 class=\"award-result-sub-heading\">Other Nominees</h4>" +
      "<section class=\"award-result-nominees\">" +
      nomineeContent +
      "</section>" : "";
    content = "<div class=\"award-result\">" +
      "<h2 class=\"award-result-heading\">" + winnerData["Award Title-"] + "</h2>" +
      "<section class=\"award-result-winner\">" +
      "    <img class=\"award-result-winner-photo\" src=\"" + winnerData["Image"] + "\" alt=\"Trulli\" width=\"400\" height=\"300\">" +
      "    <section class=\"award-result-winner-details\">" +
      "        <span class=\"position\">" + winnerData["Position"] + ", " + winnerData["ACS Function"] + "</span>" +
      "        <span class=\"name\">" + winnerData["Name of Employee/Team (As per workday)"] + "</span>" +
      "        <span class=\"description\">" + winnerData["Citation to be mentioned on slide (max 100 words)"] + "</span>" +
      "    </section>" +
      "</section>" +
      nomineeSection +
      "</div>";
  }
  return content;
}

function createNomineeDiv(nomineeData) {
  let content = "<section class=\"award-result-nominee\">" +
    "        <img class=\"award-result-nominee-photo\" src=\"" + nomineeData["Image"] + "\" alt=\"Trulli\" width=\"74\" height=\"72\">" +
    "        <section class=\"award-result-nominee-details\">" +
    "            <span class=\"position\">" + nomineeData["Position"] + ", " + nomineeData["ACS Function"] + "</span>" +
    "            <span class=\"name\">" + nomineeData["Name of Employee/Team (As per workday)"] + "</span>" +
    "        </section>" +
    "    </section>";
  return content;
}
export default init;
