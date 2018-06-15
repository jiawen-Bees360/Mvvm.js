class Mvvm{
    constructor(options = {}){
        this.$options = options;
        this._data = options.data;
        observe(this._data);

        // 数据代理。
        for(let key in this._data){
            Object.defineProperty(this, key, {
                configurable: true,
                get(){
                    return this._data[key];
                },
                set(newVal){
                    this._data[key] = newVal
                }
            })
        }

        compile(options.el, this);
        // ? 这里还有什么？
    }
}


/**
 * 编译模板，即将所有{{this.whatever}}转化为对应的值。
 * 先找到对应的根节点，一般是 id 为 options.el 的元素。
 * 递归找到该根元素下所有的文本节点。
 *
 */
function compile(el, vm){
    // 此处编译完之后，顺便赋值进去$em。
    // let root = document.querySelector(el);
    vm.$el = document.querySelector(el);
    let fragment = document.createDocumentFragment();
    let child;
    while(child = vm.$el.firstChild){
        // fragment.push(child);
        // 注意此处不是使用fragment.push。而是fragment.appendChild();
        fragment.appendChild(child)
    }
    function replace(frag){
        // 注意此处要将frag.childNodes先转为数组，因为它只是一个类数组对象。
        Array.from(frag.childNodes).forEach(node => {
            // textContent 这个属性，记忆一下。记忆一下所有的DOM操作。
            let reg = /\{\{(.*?)\}\}/g;
            let txt = node.textContent;
            if(node.nodeType === 3 && reg.test(txt)){
                // 注意reg.test调用以后，如果有括号匹配，则会分别出现在RegExp类的$1, $2..属性中。
                // 比如在这段代码中，如果匹配成功，RegExp.$1 则为 {{ }} 当中的内容
                let exp = RegExp.$1;
                console.log(exp);
                let val = expressionToValue(exp);

                // 注意此处并不是将textContent替换成表达式的值。
                // 而是将{{}}部分替换成表达式的值。
                // node.textContent = val;
                // 另外 replace()方法不会改变原字符串
                node.textContent = txt.replace(reg, val).trim();
            }

            // 严重注意。此处应该递归往下对所有的节点都进行replace操作。
            if(node.childNodes && node.childNodes.length){
                replace(node);
            }
        });
    }
    function expressionToValue(exp){
        
        // split('.'), instead of slice('.')
        let expArr = exp.split('.');
        let val = vm;
        expArr.forEach(key=>{
            val = val[key];
        })
        return val;
    }

    replace(fragment);
    vm.$el.appendChild(fragment);
}

function observe(data){
    // 原文使用双等号，单等号有何区别？
    if(!data || typeof data != 'object'){
        return ;
    }
    // why return ?
    return new Observe(data);
}

class Observe{
    constructor(data){

        for(let key in data){
            let val = data[key];
            // 注意：此处要递归往下observe
            observe(val);
            Object.defineProperty(data, key, {
                configurable: true,
                get(){
                    // warning!!! 不要使用data[key]，不然会无限循环调用。
                    // return data[key];
                    return val;
                },
                set(newVal){
                    // 这里需要注意两点。
                    // 1. 值相等时无需赋值。
                    // 2. 设置为新值后，需要将新值也observe
                    if(newVal = val) return;
                    data[key] = newVal;
                    observe(newVal);
                }
            })
        }
    }
}