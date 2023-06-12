
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
let searchAwardsSection;

function createFilterSection(ele) {
    const parentSection = createTag('div', { class: 'filter-list' });
    for (let filter of filterBy) {
        let filterSection;
        if (filter.type === 'dropdown') {
            filterSection = createTag('div', { class: 'filter-list-item' });
            filterSection.append(createTag('p', { class: 'filter-list-item-category' }, filter.name));
            const filterOptionContainer = createTag('div', { class: 'filter-list-item-container' });
            filterOptionContainer.append(createTag('button', { class: 'filter-list-item-selected', role: 'filter', 'data-filter-id': filter.id }, filter.selected));
            const filterOptionSection = createTag('div', { class: 'filter-list-item-options', hidden: true });
            for (let option of filter.options) {
                filterOptionSection.append(createTag('button', { class: 'filter', role: 'filter-options', 'data-filter-by': filter.id }, option));
            }
            filterOptionContainer.append(filterOptionSection);
            filterSection.append(filterOptionContainer);
        }
        else if (filter.type === 'textfield') {
            filterSection = createTag('div', { class: 'filter-list-item text-field-input' });
            filterSection.append(createTag('input', { type: 'text-field', placeholder: filter.name, class: 'filter-list-item-selected', 'data-filter-id': filter.id, role: 'filter' }));
            const filterOptionSection = createTag('div', { class: 'filter-list-item-options', hidden: true });
            for (let option of filter.options) {
                filterOptionSection.append(createTag('button', { class: 'filter', role: 'filter-options', 'data-filter-by': filter.id }, option));
            }
            filterSection.append(filterOptionSection);
        }
        parentSection.append(filterSection);
    }
    ele.append(parentSection);
    return parentSection;
}

function createResultSection(ele) {
    const resultsSection = createTag('div', { class: 'search-results' });

    resultsSection.append(createTag('h2', { class: 'search-results-count' }, `${searchResultData.length} ${searchResultStr}`));
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
    resultsSection.append(winnersSection);
    ele.append(resultsSection);

}

function getFilteredData(data, filterName) {
    for (let filter of filterName) {
        if (filter.selected) {
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
async function fetchData(path) {
    const nominationResponse = await fetch(path);
    const nominationJsonData = await nominationResponse.json();
    const resultsResponse = await fetch(`${path}?sheet=${resultsSheetStr}`);
    const resultsJsonData = await resultsResponse.json();
    excelData = mergeArraysById(nominationJsonData.data, resultsJsonData.data);
    console.log('excelData', excelData);
    searchAwardsSection.querySelector('.filter-list')?.remove();
    searchAwardsSection.querySelector('.search-results')?.remove();
    createFilterData();
    searchResultData = getFilteredData(excelData, filterBy);
    initFilters(createFilterSection(searchAwardsSection));
    createResultSection(searchAwardsSection);
}
function initFilters(elm) {
    const filters = elm.querySelectorAll('[role="filter"]');
    filters.forEach((filter) => {
        filter.addEventListener('click', viewFilters);
    });

    const filterOptions = elm.querySelectorAll('[role="filter-options"]');
    filterOptions.forEach((option) => {
        option.addEventListener('click', changeFilters);
    });
}
function changeFilters(e) {
    const { target } = e;
    const id = target.getAttribute('data-filter-by');
    const t = searchAwardsSection.querySelector(`.filter-list-item-selected[data-filter-id=${id}]`);
    console.log(t);

    t.textContent = target.textContent;
    t.click();
    updateFilter(id, target.textContent.trim());
    console.log('filterByOptions', filterBy);
    console.log('searchResultData', searchResultData);
}
function updateFilter(key, value) {
    for (let filter of filterBy) {
        if (filter.id === key) {
            filter.selected = value;
            searchResultData = getFilteredData(excelData, filterBy);
            searchAwardsSection.querySelector('.search-results').remove();
            createResultSection(searchAwardsSection);
            console.log("reload dom");
            return;
        }
    }
}
function viewFilters(e) {
    const { target } = e;
    const parent = target.parentNode;
    parent.querySelectorAll('.filter-list-item-options')
        .forEach((t) => t.toggleAttribute('hidden'));

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
        searchAwardsSection = rootElem.querySelector('.search-awards');
        if (!searchAwardsSection) return;
        const rowsSearchAwards = searchAwardsSection.querySelectorAll(':scope > div');
        rowsSearchAwards.forEach((row) => {
            const key = getStringKeyName(row.children[0].textContent);
            if (key === 'path') {
                let val = row.children[1].textContent;
                fetchData(val);
                row.remove();
            }
        });
    });
};


export default init;
