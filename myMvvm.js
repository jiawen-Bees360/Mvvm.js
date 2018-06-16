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
                let val = expressionToValue(exp);

                // 注意此处并不是将textContent替换成表达式的值。
                // 而是将{{}}部分替换成表达式的值。
                // node.textContent = val;
                // 另外 replace()方法不会改变原字符串
                node.textContent = txt.replace(reg, val).trim();

                new Watcher(vm, exp, newVal=>{
                    console.log('hello')
                    node.textContent = txt.replace(reg, newVal).trim();
                })
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
            // 注意，dep应该定义在此处而不是for循环以外，
            // 因为我们希望notify尽可能少的数据进行变化
            let dep = new Dep();
            let val = data[key];
            // 注意：此处要递归往下observe
            observe(val);
            Object.defineProperty(data, key, {
                configurable: true,
                get(){
                    // warning!!! 不要使用data[key]，不然会无限循环调用。
                    // return data[key];
                    Dep.target && dep.addSub(Dep.target);
                    return val;
                },
                set(newVal){
                    // 这里需要注意两点。
                    // 1. 值相等时无需赋值。
                    // 2. 设置为新值后，需要将新值也observe
                    if(newVal == val) return;
                    val = newVal;
                    observe(newVal);
                    dep.notify();
                }
            })
        }
    }
}

class Watcher{
    
    /**
     *Creates an instance of Watcher.
     * @param {*} vm mvvm对象，用于update的时候获取值。
     * @param {*} exp 该watcher watch的表达式。
     * @param {*} fn 该watcher被通知的时候，执行的方法。
     * @memberof Watcher
     */
    constructor(vm, exp, fn){
        this.vm = vm;
        this.fn = fn;
        this.exp = exp;

        Dep.target = this;
        // 注意此处，是用一种非常tricky的方式，将watcher加入到observe那里的dep实例当中。
        // val在该构造函数中其实没有用上，其主要目的是触发 mvvm 对应data的get方法，
        // get方法中，将Dep.target加入dep.subs数组中，而Dep.target则在这里设置成了this。
        // 非常tricky。
        let expArr = exp.split('.');
        let val = this.vm;
        expArr.forEach(key => {
            val = val[key];
        })
        Dep.target = null;
    }
    update(){
        let val = this.vm;
        let expArr = this.exp.split('.');
        expArr.forEach(key=>{
            val = val[key]
        })
        this.fn(val);
    }
}

class Dep{
    constructor(){
        this.subs = [];
    }
    addSub(watcher){
        this.subs.push(watcher);
    }
    notify(){
        this.subs.forEach(sub => sub.update());
    }
}
