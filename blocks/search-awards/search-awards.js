
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
const allStr = "All";
const loadMoreStr = "Load more results"

let incomingData;
let filteredData;
let filterBy = [];
let searchAwardsDOM;
let winnersSectionDOM;
const initialCountToShow = 3;
const incrementalCountToShow = 3;
let resultCount = initialCountToShow;


const init = (block) => {
    const rootElem = block.closest('.fragment') || document;
    const allSections = Array.from(rootElem.querySelectorAll('div.section'));
    allSections.forEach((e, i) => {
        let categoryMap = {};
        let categoryId;
        const filterSectionMetadata = e.querySelectorAll(':scope > .section-metadata');
        if (!filterSectionMetadata) return;
        filterSectionMetadata.forEach((f) => {
            const className = f.className.replace('section-metadata', '');
            if (className.includes("filter")) {
                const rows = f.querySelectorAll(':scope > div');
                let filter = {};
                rows.forEach((row) => {
                    if (row.children[0].textContent === 'options') {
                        filter[row.children[0].textContent] = row.children[1].textContent.split(',').map(o => o.trim());
                    }
                    else {
                        filter[row.children[0].textContent] = row.children[1].textContent;
                    }
                });
                filterBy.push(filter);
            }
            if (className.includes("id-")) {
                categoryId = className.replace('id-', '').trim();
                const rows = f.querySelectorAll(':scope > div');
                rows.forEach((row) => {
                    categoryMap[row.children[0].textContent.trim()] = row.children[1].textContent.trim();
                });
            }
            f.remove();
        });
        filterBy.map((fb) => {
            if (fb.id === categoryId) {
                fb['datapath'] = categoryMap;
            }
        });
        filterBy.push({ name: 'Status', id: 'status', type: 'hidden', selected: 'Winner' });
        searchAwardsDOM = rootElem.querySelector('.search-awards');
        if (!searchAwardsDOM) return;
        const rowsSearchAwards = searchAwardsDOM.querySelectorAll(':scope > div');
        rowsSearchAwards.forEach((row) => {
            const key = getStringKeyName(row.children[0].textContent);
            if (key === 'path') {
                let val = row.children[1].textContent;
                fetchData(categoryMap[val], val);
                row.remove();
            }
        });
    });
};

async function fetchData(dataPath, selectedCategory) {
    console.log("Data loading", new Date());
    searchAwardsDOM.querySelector('.filter-list')?.remove();
    searchAwardsDOM.querySelector('.search-results')?.remove();
    toggleLoadingSection();
    const nominationResponse = await fetch(dataPath);
    const nominationJsonData = await nominationResponse.json();
    const resultsResponse = await fetch(`${dataPath}?sheet=${resultsSheetStr}`);
    const resultsJsonData = await resultsResponse.json();
    incomingData = mergeArraysById(nominationJsonData.data, resultsJsonData.data);
    console.log("Data loaded", new Date());
    toggleLoadingSection();
    createFilterByOptions(selectedCategory);
    filteredData = getFilteredData(incomingData, filterBy);
    initFilters(createFilterDOM(searchAwardsDOM));
    initLoadMore(createResultDOM(searchAwardsDOM));
    console.log("DOM loaded", new Date());
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

const createFilterByOptions = (selectedValue) => {
    for (let filter of filterBy) {
        let filterSet = new Set();
        filterSet.add(allStr);
        for (let data of incomingData) {
            if (data[filter?.id])
                filterSet.add(camelize(data[filter?.id].toLowerCase()));
        }
        if (!filter.datapath) {
            filter.options = Array.from(filterSet);
            filter.selected = filter.type !== 'hidden' ? filter.options[0] : filter.selected;
        } else {
            filter.selected = selectedValue;
        }
    }
};

function createFilterDOM(elm) {
    const parentSection = createTag('div', { class: 'filter-list' });
    for (let filter of filterBy) {
        if (filter.type === 'dropdown') {
            let filterSection;
            filterSection = createTag('div', { class: 'filter-list-item' });
            filterSection.append(createTag('p', { class: 'filter-list-item-category' }, filter.name));
            const filterOptionContainer = createTag('div', { class: 'filter-list-item-container' });
            const selectedButton = createTag('button', { class: 'filter-list-item-selected', role: 'filter', 'data-filter-id': filter.id });
            selectedButton.append(createTag('span', { class: 'selected-text' }, filter.selected));
            selectedButton.append(createTag('img', { class: 'chevron-icon', src: '/blocks/search-awards/chevron.svg', width: '10', height: '10' }));
            filterOptionContainer.append(selectedButton);
            const filterOptionSection = createTag('div', { class: 'filter-list-item-options', hidden: true });
            for (let option of filter.options) {
                filterOptionSection.append(createTag('button', { class: 'filter', role: 'filter-options', 'data-filter-by': filter.id }, option));
            }
            filterOptionContainer.append(filterOptionSection);
            filterSection.append(filterOptionContainer);
            parentSection.append(filterSection);
        }
    }
    elm.append(parentSection);
    return parentSection;
}
function createLoadingFilterDOM(elm) {
    const parentSection = createTag('div', { class: 'filter-list loading' });
    let filterSection = createTag('div', { class: 'filter-list-item' });
    filterSection.append(createTag('div', { class: 'filter-list-item-category' }));
    filterSection.append(createTag('div', { class: 'filter-list-item-container' }));
    parentSection.append(filterSection);
    parentSection.append(filterSection.cloneNode(true));
    parentSection.append(filterSection.cloneNode(true));
    parentSection.append(filterSection.cloneNode(true));
    elm.append(parentSection);
}

function createResultDOM(elm) {
    const resultsSection = createTag('div', { class: 'search-results' });
    resultsSection.append(createTag('h2', { class: 'search-results-count' }, `${filteredData.length} ${searchResultStr}`));
    winnersSectionDOM = createTag('div', { class: 'search-results-winners' });
    if (filteredData.length > initialCountToShow) {
        resultsSection.append(createLoadMoreResultsDOM(0, initialCountToShow));
        const loadMoreSection = createTag('div', { class: 'search-results-load-more' });
        loadMoreSection.append(createTag('p', { class: 'load-more-text' }, `Displaying ${initialCountToShow} out of ${filteredData.length}`));
        loadMoreSection.append(createTag('button', { class: 'load-more-button', role: 'load' }, loadMoreStr));
        resultsSection.append(loadMoreSection);
    }
    else {
        resultsSection.append(createLoadMoreResultsDOM(0, filteredData.length));
    }
    elm.append(resultsSection);
    return resultsSection;
}

function createLoadMoreResultsDOM(i, j) {
    for (const [index, data] of filteredData.entries()) {
        if (i <= index && index < j) {
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
            winnersSectionDOM.append(createTag('div', { class: 'card-horizontal' }, createTag('div', { class: 'foreground' }, winnerSection)));
        }
    }
    return winnersSectionDOM;
}
function createLoadingResultDOM(elm) {
    const resultsSection = createTag('div', { class: 'search-results loading' });
    resultsSection.append(createTag('h2', { class: 'search-results-count' }));
    const winnersSection = createTag('div', { class: 'search-results-winners' });
    const winnerSection = createTag('div', { class: 'card-block', 'data-valign': 'middle' });
    winnerSection.append(createTag('div', { class: 'card-image' }));
    let details = createTag('div', { class: 'card-content' });
    details.append(createTag('p', { class: 'body-xs' }));
    details.append(createTag('h2', { class: 'heading-xs' }));
    details.append(createTag('h2', { class: 'heading-xs' }));
    winnerSection.append(details);
    const cardSection = createTag('div', { class: 'card-horizontal' });
    cardSection.append(createTag('div', { class: 'foreground' }, winnerSection));
    winnersSection.append(cardSection);
    winnersSection.append(cardSection.cloneNode(true));
    winnersSection.append(cardSection.cloneNode(true));
    winnersSection.append(cardSection.cloneNode(true));
    winnersSection.append(cardSection.cloneNode(true));
    winnersSection.append(cardSection.cloneNode(true));
    winnersSection.append(cardSection.cloneNode(true));
    winnersSection.append(cardSection.cloneNode(true));
    winnersSection.append(cardSection.cloneNode(true));
    resultsSection.append(winnersSection);
    elm.append(resultsSection);
}

const toggleLoadingSection = () => {
    const loadingSection = searchAwardsDOM.querySelectorAll(':scope > .loading');
    if (loadingSection.length) {
        loadingSection.forEach((row) => {
            row.remove();
        });
    }
    else {
        createLoadingFilterDOM(searchAwardsDOM);
        createLoadingResultDOM(searchAwardsDOM);
    }
}

function getFilteredData(data, filterName) {
    for (let filter of filterName) {
        if (filter.selected && filter.selected !== allStr) {
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
function camelize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function initFilters(elm) {
    const filters = elm.querySelectorAll('[role="filter"]');
    filters.forEach((filter) => {
        filter.addEventListener('click', toggleFilter);
    });

    const filterOptions = elm.querySelectorAll('[role="filter-options"]');
    filterOptions.forEach((option) => {
        option.addEventListener('click', changeFilters);
    });
}

function initLoadMore(elm) {
    const loadMore = elm.querySelectorAll('[role="load"]');
    loadMore.forEach((load) => {
        load.addEventListener('click', loadMoreResults);
    });
}

function changeFilters(e) {
    const { target } = e;
    const id = target.getAttribute('data-filter-by');
    const t = searchAwardsDOM.querySelector(`.filter-list-item-selected[data-filter-id=${id}]`);
    t.querySelector(`.selected-text`).textContent = target.textContent;
    t.click();
    updateFilter(id, target.textContent.trim());
}

function updateFilter(key, value) {
    for (let filter of filterBy) {
        if (filter.id === key) {
            filter.selected = value;
            if (filter['datapath']) {
                fetchData(filter['datapath'][value], value);
                return;
            }
            filteredData = getFilteredData(incomingData, filterBy);
            searchAwardsDOM.querySelector('.search-results').remove();
            resultCount = initialCountToShow;
            initLoadMore(createResultDOM(searchAwardsDOM));
            return;
        }
    }
}

function toggleFilter(e) {
    const { target } = e;
    const parent = target.closest('.filter-list-item-container');
    parent.classList.toggle("active");
    parent.querySelectorAll('.filter-list-item-options')
        .forEach((t) => t.toggleAttribute('hidden'));

}

function loadMoreResults() {
    if (filteredData.length > resultCount) {
        searchAwardsDOM.querySelector('.load-more-button').removeAttribute('disabled');
        createLoadMoreResultsDOM(resultCount, resultCount + incrementalCountToShow);
        resultCount += incrementalCountToShow;
        resultCount = resultCount > filteredData.length ? filteredData.length : resultCount;
    }
    searchAwardsDOM.querySelector('.search-results-load-more p.load-more-text').textContent = `Displaying ${resultCount} out of ${filteredData.length}`;
    if (resultCount === filteredData.length) {
        searchAwardsDOM.querySelector('.load-more-button').setAttribute('disabled', true);
    }

}

export default init;
