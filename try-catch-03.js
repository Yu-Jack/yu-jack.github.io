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
function test2(data) {
    return new Promise((res, rej) => {
        setTimeout(() => {
            console.log("test2 handle data: " + data);
            rej("test2 have error.")
        }, 1000)
    })
}

function handleTest1ResultIsNull(error) {
    console.log("handleTest1ResultIsNull's error message " + error);
    return "someConditionalValue"
}

async function main() {
    let error, result
    [error, result] = await to(test1());
    console.log("result: " + result);
    if (error) {
        console.log("get error-1");
        console.log(error);
    }

    if (!result) {
        result = handleTest1ResultIsNull(error);
    }

    [error, result] = await to(test2(result));
    console.log("result: " + result);
    if (error) {
        console.log("get error-2");
        console.log(error);
        return;
    }
}

main()