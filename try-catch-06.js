function test1() {
    return new Promise((res, rej) => {
        let error = "test1 have error";
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
    try {
        let error, result
        [error, result] = await test1().then(result => [null, result]).catch(error => [error, null]);
        console.log("result: " + result);

        if (!result) {
            result = handleTest1ResultIsNull(error);
        }

        result = await test2(result);
        console.log("result: " + result);
    } catch (error) {
        console.log("get error");
        console.log(error);
    }
}

main()