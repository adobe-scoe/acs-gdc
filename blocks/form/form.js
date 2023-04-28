function createSelect(fd) {
    const select = document.createElement('select');
    select.id = fd.Field;
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
    console.debug('nomination open -  ',nominationOpen)
    const button = document.createElement('button');
    button.textContent = fd.Label;
    button.classList.add('button');
    if (fd.Type === 'submit') {
        button.addEventListener('click', async (event) => {
            const form = button.closest('form');
            if (form.checkValidity() ) {
                event.preventDefault();
                button.setAttribute('disabled', '');
                await submitForm(form);
                const redirectTo = fd.Extra;
                window.location.href = redirectTo;
            }
        });
        if(!nominationOpen){
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
    if (fd.Mandatory === 'x') {
        input.setAttribute('required', 'required');
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

async function createForm(formURL) {
    console.debug('inside create form path :' , formURL)
    const beginDate = new Date('1900-01-01');// Set start date as January 1st, 1900
    const millisecondsPerDay = 24 * 60 * 60 * 1000; // Number of milliseconds in a day
    var nominationOpen = false;
    const { pathname } = new URL(formURL);
    const checkValidityFormURL  = formURL+"?sheet=config";
    const {configpath} = new URL(checkValidityFormURL);
    //const validityResp = await fetch(configpath);
   // const validityjson = await validityResp.json();
    console.debug(checkValidityFormURL);
    const validityresp = await fetch(checkValidityFormURL,{cache: 'no-cache', mode: 'cors'});
    const datejson = await validityresp.json();
    console.debug(datejson);
    const endDate = new Date(beginDate.getTime() + (datejson.data[0].endDate * millisecondsPerDay)); // Calculate end date by adding milliseconds
    const startDate = new Date(beginDate.getTime() + (datejson.data[0].startDate * millisecondsPerDay)); // Calculate end date by adding milliseconds
    console.debug('startDate -',startDate);
    console.debug('endDate -',endDate);

    const currentDate = new Date(); // Get current date
    console.debug('currentdate - ', currentDate)
    if (currentDate >= startDate && currentDate <endDate){
        //TODO set a flag 
        console.debug('current date in range , nomination open')
        nominationOpen = true;
    }else {
        //TODO unset a flag 
        console.debug('current date not range , nomination closed')
        nominationOpen = false;
    }

    const resp = await fetch(pathname);
    const json = await resp.json();
    const form = document.createElement('form');
    const rules = [];
    console.debug(json)
    // eslint-disable-next-line prefer-destructuring
    form.dataset.action = pathname.split('.json')[0];
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
            case 'text-area':
                fieldWrapper.append(createLabel(fd));
                fieldWrapper.append(createTextArea(fd));
                break;
            case 'submit':
                fieldWrapper.append(createButton(fd, nominationOpen));
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
        form.replaceWith(await createForm(form.href));
    }
}