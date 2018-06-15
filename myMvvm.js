class Mvvm{
    constructor(options = {}){
        this.$options = options;
        this._data = options.data;
        observe(this._data);
        // ? 这里还有什么？
    }
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
                    return data[key];
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