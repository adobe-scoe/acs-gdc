
import { getLibs } from '../../scripts/utils.js';

const { createTag } = await import(`${getLibs()}/utils/utils.js`);

const resultsSheetStr = "results";
const dataId = "recordId";
const imageStr = "image";
const ldapStr = "empLdap";
const pngStr = ".png";
const yearStr = "year";
const quarterStr = "quarter";
const nameStr = "empName";
const awardStr = "award";
const searchResultStr = "Search Results";

let excelData;
let searchResultData;
let filterBy = [];

function createFilterSection(ele) {
    const parentSection = createTag('div', { class: 'filter-list' });
    for (let filter of filterBy) {
        const filterSection = createTag('div', { class: 'filter-list-item' });
        if (filter.type === 'dropdown') {
            filterSection.append(createTag('span', { class: 'filter-list-item-category', 'data-filter': filter.id }, filter.name));
            const filterOptionContainer = createTag('div', { class: 'filter-list-item-container' });
            filterOptionContainer.append(createTag('span', { class: 'filter-list-item-selected' }), filter.selected);
            const filterOptionSection = createTag('div', { class: 'filter-list-item-options', hidden: true });
            for (let option of filter.options) {
                filterOptionSection.append(createTag('span', { class: 'filter' }, option));
            }
            filterOptionContainer.append(filterOptionSection);
            filterSection.append(filterOptionContainer);
            filterSection.append(createTag('span', { class: 'filter-list-item-toggle' }));
        }
        else if (filter.type === 'textfield') {
            filterSection.append(createTag('input', { type: 'text-field', id: filter.id, placeholder: filter.name, class: 'filter-list-item-category', 'data-filter': filter.id }));
        }
        parentSection.append(filterSection);
    }
    ele.append(parentSection);
}

function createResultSection(ele) {
    ele.append(createTag('h2', { class: 'search-results-count' }, `${searchResultData.length} ${searchResultStr}`));
    const winnersSection = createTag('div', { class: 'search-result-winners' });
    for (let data of searchResultData) {
        const winnerSection = createTag('div', { class: 'card-block', 'data-valign': 'middle' });
        const imageSrc = data[imageStr] ? data[imageStr] : '/profile/' + data[ldapStr] + pngStr;
        const imageSection = createTag('object', { data: imageSrc, type: 'image/png' });
        imageSection.append(createTag('img', { src: '/profile/default.png', alt: data[ldapStr] }));
        winnerSection.append(createTag('div', { class: 'card-image' }, imageSection));
        let details = createTag('div', { class: 'card-content' });
        details.append(createTag('p', { class: 'body-xs' }, `${data[yearStr]} - ${data[quarterStr]}`));
        details.append(createTag('h2', { class: 'heading-xs' }, data[awardStr]));
        details.append(createTag('h2', { class: 'heading-xs' }, data[nameStr]));
        winnerSection.append(details);
        winnersSection.append(createTag('div', { class: 'card-horizontal' }, createTag('div', { class: 'foreground' }, winnerSection)));
    }
    ele.append(winnersSection);
}

function getFilteredData(data, filterName) {
    for (let filter of filterName) {
        if(filter.selected){
            data = data.filter(function (entry) {
                return filter?.selected?.toLowerCase() === entry[filter.id]?.toLowerCase();
            });
        }
    }
    return data;
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
    searchResultData = getFilteredData(excelData, filterBy);
    createFilterSection(ele);
    createResultSection(ele);
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
                filterSet.add(data[filter?.id]);
            }
            if (!filter.options) {
                filter.options = Array.from(filterSet);
            }
            if (filter.type !== 'textfield')
                filter.selected = filter.options[0];

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
            filter.name = row.children[0].textContent;
            filter.id = row.children[1].textContent;
            filter.type = row.children[2].textContent;
            let options = row.children[3].textContent;
            if (options) {
                filter.options = options.split(',');
            }
            filterBy.push(filter);
        });
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
