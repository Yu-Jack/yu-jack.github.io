function test1() {
    return new Promise((res, rej) => {
        let error = "test1 have error";
        setTimeout(() => {
            if (error) {
                res(handleTest1ResultIsNull(error))
            } else {
                res("success")
            }
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
    console.log("handleTest1ResultIsNull's error message" + error);
    return "someConditionalValue"
}

async function main() {
    try {
        let result
        result = await test1();
        console.log("result: " + result);
        result = await test2(result);
        console.log("result: " + result);
    } catch (error) {
        console.log("get error");
        console.log(error);
    }
}

main()