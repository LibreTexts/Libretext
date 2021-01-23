const fs = require('fs-extra');


main()

async function main(){
    let result = await fs.readJSON('users.json');
    result = result.user;
    result = result.map(item=>item.username)
    await fs.writeJSON('usernames.json',result);
}
