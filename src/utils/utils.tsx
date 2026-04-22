
const checkIsUserlogged = () => {

    const userInfo = sessionStorage.getItem('user');

    if (userInfo) {
        return true;
    }

    return false;
}
