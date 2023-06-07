
import { getLibs } from '../../scripts/utils.js';

const { createTag } = await import(`${getLibs()}/utils/utils.js`);

const resultsSheetStr = "results";
const dataId = "recordId";
let excelData;
let filterBy = [];

function createFilterSection(ele) {
    const parentSection = createTag('div', { class: 'filter-list' });
    for (let filter of filterBy) {
        const filterSection = createTag('div', { class: 'filter-list-item' });
        filterSection.append(createTag('span', { class: 'filter-list-item-category' }, filter.key));
        const filterOptionContainer = createTag('div', { class: 'filter-list-item-container' });
        filterOptionContainer.append(createTag('span', { class: 'filter-list-item-selected' }));
        const filterOptionSection = createTag('div', { class: 'filter-list-item-options' });
        for (let option of filter.options) {
            filterOptionSection.append(createTag('span', { class: 'filter' }, option));
        }
        filterOptionContainer.append(filterOptionSection);
        filterOptionContainer.append(createTag('span', { class: 'filter-list-item-toggle' }));
        filterSection.append(filterOptionContainer);
        parentSection.append(filterSection);
    }
    ele.append(parentSection);
}

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
function getStringKeyName(str) {
    /*
    The [^...] character class is used to match any character that is not a valid CSS selector character.
    The \p{L} and \p{N} Unicode properties are used to match any letter or digit character in any language.
    */
    const regex = /[^\p{L}\p{N}_-]/gu;
    return str.trim().toLowerCase().replace(/\s+/g, '-').replace(regex, '');
}
async function fetchData(path, ele) {
    const nominationResponse = await fetch(path);
    const nominationJsonData = await nominationResponse.json();
    const resultsResponse = await fetch(`${path}?sheet=${resultsSheetStr}`);
    const resultsJsonData = await resultsResponse.json();
    excelData = mergeArraysById(nominationJsonData.data, resultsJsonData.data);
    console.log('excelData', excelData);
    createFilterData();
    createFilterSection(ele);
}
const mergeArraysById = (nominationArr = [], resultsArray = []) => {
    let res = [];
    res = nominationArr.map(obj => {
        const index = resultsArray.findIndex(el => el[dataId] == obj[dataId]);
        const { status, image } = index !== -1 ? resultsArray[index] : {};
        return {
            ...obj,
            status,
            image
        };
    });
    return res;
};

const createFilterData = () => {
    if (excelData) {
        for (let filter of filterBy) {
            let filterSet = new Set();
            for (let data of excelData) {
                filterSet.add(data[filter.value]);
            }
            filter.options = Array.from(filterSet);
        }
        console.log('filterByOptions', filterBy);
    }
    else {
        setTimeout(() => {
            createFilterData(key, val);
        }, 100);
    }
};
const init = (block) => {
    const rootElem = block.closest('.fragment') || document;
    const allSections = Array.from(rootElem.querySelectorAll('div.section'));
    allSections.forEach((e, i) => {

        const sectionMetadata = e.querySelector(':scope > .section-metadata');
        if (!sectionMetadata) return;
        const rows = sectionMetadata.querySelectorAll(':scope > div');
        rows.forEach((row) => {
            let filter = {};
            const key = row.children[0].textContent;
            let val = getStringKeyName(row.children[1].textContent);
            filter.key = key;
            filter.value = val;
            filterBy.push(filter);
        });
        console.log('filterBy', filterBy);

        const searchAwards = rootElem.querySelector('.search-awards');

        if (!searchAwards) return;
        const rowsSearchAwards = searchAwards.querySelectorAll(':scope > div');
        rowsSearchAwards.forEach((row) => {
            const key = getStringKeyName(row.children[0].textContent);
            if (key === 'path') {
                let val = row.children[1].textContent;
                fetchData(val, searchAwards);
                row.remove();
            }
        });
    });
};


export default init;
