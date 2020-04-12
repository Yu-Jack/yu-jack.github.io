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
    let result
    try {
        result = await test1();
        console.log("result: " + result);
    } catch (error) {
        console.log("get error-1");
        console.log(error);
    }

    if (!result) {
        result = handleTest1ResultIsNull(error);
    }

    try {
        result = await test2(result);
        console.log("result: " + result);
    } catch (error) {
        console.log("get error-2");
        console.log(error);
    }
}

main()