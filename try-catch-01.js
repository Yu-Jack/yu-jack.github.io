async function to(promise) {
    return promise.then((result) => {
        return [
            null,
            result
        ]
    }).catch((error) => {
        return [
            error,
            null
        ]
    })
}

function test1() {
    return new Promise((res, rej) => {
        setTimeout(() => {
            rej("test1 have error.")
        }, 1000)
    })
}
function test2() {
    return new Promise((res, rej) => {
        setTimeout(() => {
            rej("test2 have error.")
        }, 1000)
    })
}
function test3() {
    return new Promise((res, rej) => {
        setTimeout(() => {
            rej("test3 have error.")
        }, 1000)
    })
}

async function main() {
    let error, result
    [error, result] = await to(test1());
    console.log(result);
    if (error) {
        console.log("get error-1");
        console.log(error);
        return;
    }

    [error, result] = await to(test2());
    console.log(result);
    if (error) {
        console.log("get error-2");
        console.log(error);
        return;
    }
    
    [error, result] = await to(test3());
    console.log(result);
    if (error) {
        console.log("get error-3");
        console.log(error);
        return;
    }
}

main()