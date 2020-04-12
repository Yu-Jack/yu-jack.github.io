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
    try {
        let result
        result = await test1();
        console.log(result);
        result = await test2();
        console.log(result);
        result = await test3();
        console.log(result);
    } catch (error) {
        console.log("get error");
    }
}

main()