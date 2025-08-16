var AUTH_CLIENT = null;
const process = require('process');
const readline = require('node:readline');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: '>' });
const { authorize, listLabels, listMailByLabel, getMessageById } = require('./modules.js');
const fs = require('node:fs');
const { isAsyncFunction } = require('node:util/types');

const structure = {
    appendHistory: () => structure.history.push(structure.current),
    current: {},
    history: [],
    menus: {
        LABEL: {
            msg: {},
            _init_ran: false,
            _init: async () => {
                await listLabels(AUTH_CLIENT).then((res) => {
                    res && (structure.menus.LABEL.LBLIST = res.map((l) => {
                        return l.id;
                    }))
                });
                return;
            },
            SAVEMSG: async (id) => {
                await getMessageById(AUTH_CLIENT, id, 'raw').then((m) => { fs.writeFileSync(`./messages/${id}.eml`, m.raw, { encoding: 'base64url' }) });
            },
            /* FETCHLB: async () => { // effectively ran in _init()
                await listLabels(AUTH_CLIENT).then((labels) => {
                    labels && (structure.menus.LABEL.LBLIST = labels.map((label) => {
                        return label.id;
                    }))
                })
            }, */
            FINDMSG: async (index, maxResults) => { // this only lists messages. Add a search feature tomorrow that uses the has: includes: in:, etc. filter called SEARCHMSG(query, maxResults)
                maxResults = parseInt(maxResults);
                if (null != structure.menus.LABEL.LBLIST?.[index] && !isNaN(maxResults)) {
                    console.log(`Fetching ${maxResults} messages from ${structure.menus.LABEL.LBLIST[index]}`);
                    await listMailByLabel(AUTH_CLIENT, structure.menus.LABEL.LBLIST[index], maxResults).then((mail) => {
                        printGapped(mail);
                    }).catch((e) => { console.log(e) });
                }
            },
            LBLIST: [],
            NEXTPG: async () => {
                //implement nextpagetoken   
            },
            SHOWMSG: async (id) => {
                await getMessageById(AUTH_CLIENT, id).then((message) => {
                    structure.menus.LABEL.msg = message;
                    printGapped(structure.menus.LABEL.msg);
                });
            },
        },
        /*TEST: {
            _init_ran: false,
            _init: () => { console.log('Opened test menu!\n') },
            _hidden_obj: {},
            sample_obj: { _hidden_key: 'hehe', visible_key: 'boo' },
            STRUCTURE: () => { console.log(JSON.stringify(structure)) },
            obj: { 'z': 'a' },
            data: ['a', {
                func1: () => console.log('SUPER FUCKING COOL YO!!!!!')
            }, 'really cool list of values'.split('')],
            PRINT: (...args) => { console.log(args) },
        },*/
    },
}

structure.current = structure.menus;

function printGapped(data) {
    console.log('\n');
    console.log(data);
    console.log('\n');
}

async function openStructure(components, traverse_mode = false) {
    let keys = Object.keys(components);
    if (keys.includes('_init_ran') && keys.includes('_init') && components?._init_ran === false) {
        isAsyncFunction(components._init) ? await components._init() : components._init();
        components._init_ran = true;
    }
    /* console.log(components); // use block for testing
    return; */
    let out = keys?.map((k) => {
        if (k.startsWith('_')) return null; // hide anything that you don't wish for the user to see by making its key start with '_'.
        if (Array.isArray(components[k])) return `${k}: [array (${components[k]?.length})]`;
        if (typeof components[k] === 'object') return `${k}: [${typeof components[k]}]`;
        if (typeof components[k] === 'function') return `${k}: [${typeof components[k]}]`;
        return `${k}: ${components[k]} [${typeof components[k]}]`;
    });
    out = out.filter((c) => { if (c) return c });
    if (traverse_mode) out.push('<TRAVERSE MODE>');
    printGapped(out.join('\n'));
    rl.prompt();
}

authorize().then(async (auth) => {
    AUTH_CLIENT = auth;
    openStructure(structure.menus);
    rl.setPrompt('>');
    rl.prompt();
    rl.on('line', async (args) => {
        try {
            args = args.split(',');
            switch (args[0]) { // basic universal commands
                case 'exit': process.exit(1);
                case 'help': {
                    openStructure(structure.current);
                    rl.prompt();
                    return;
                }
                case 'home': {
                    structure.current = structure.menus;
                    openStructure(structure.current);
                    rl.prompt();
                    return;
                }
                case 'back': {
                    structure.current = structure.history.pop() || structure.current;
                    openStructure(structure.current);
                    rl.prompt();
                    return;
                }
                case 'clear': {
                    if (args?.[1] === 'h')
                        structure.history = [];
                    else
                        console.clear();
                    rl.prompt();
                    return;
                }
                case 'log': { // allow this thing to penetrate into objects with .key or ['key'] syntax, eval? or create an "enter" command that just force-sets structure.current to be structure.current[input]
                    if (Object.keys(structure.current).includes(args[1])) {
                        console.log(structure.current[args[1]])
                    }
                    rl.prompt();
                    return;
                }
                case 'enter': { //override disabling TUI navigation inside of objects
                    if (Object.keys(structure.current).includes(args[1])) {
                        structure.appendHistory();
                        structure.current = structure.current[args[1]];
                        openStructure(structure.current, true);
                    }
                    rl.prompt();
                    return;
                }
            }

            if (Object.keys(structure.current).includes(args[0])) { // selector
                let data = structure.current[args[0]];
                switch (typeof data) {
                    case 'function': {
                        await data.apply(this, args.slice(1));
                        rl.prompt();
                        return;
                    }
                    case 'object': {
                        structure.appendHistory();
                        if (!Array.isArray(data)) { // annoying issue with arrays, you may forget you've entered one, or everything is just jank about it
                            structure.current = data;
                        }
                        openStructure(data);
                        return;
                    }
                    default: {
                        console.log(data);
                        return;
                    }
                }
            }
            rl.prompt();
        } catch (e) {
            console.error(e);
            openStructure(structure.current);
            rl.prompt();
        }
    });
})