// 사용자 목록 로딩
async function getUser() {
  try {
    const res = await axios.get('/users');
    const users = res.data;
    console.log(users);

    const tbody = document.querySelector('#user-list tbody');
    tbody.innerHTML = '';

    users.forEach((user) => {
      const row = document.createElement('tr');

      // ID
      let td = document.createElement('td');
      td.textContent = user.id;
      row.appendChild(td);

      // 이름
      td = document.createElement('td');
      td.textContent = user.name;
      row.appendChild(td);

      // 학번
      td = document.createElement('td');
      td.textContent = user.studentId;
      row.appendChild(td);

      // 아이디(username)
      td = document.createElement('td');
      td.textContent = user.username;
      row.appendChild(td);

      tbody.appendChild(row);
    });
  } catch (err) {
    console.error(err);
  }
}

// ----------------------------
// 회원가입 처리
document.getElementById('user-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = e.target.name.value;
  const studentId = e.target.studentId.value;
  const username = e.target.username.value;
  const password = e.target.password.value;
  const confirmPassword = e.target.confirmPassword.value;

  if (!name || !studentId || !username || !password || !confirmPassword) {
    return alert('모든 필드를 입력하세요');
  }

  if (password !== confirmPassword) {
    return alert('비밀번호가 일치하지 않습니다');
  }

  try {
    await axios.post('/users', { name, studentId, username, password, confirmPassword });
    alert('회원가입 성공!');
    getUser();
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.message || '회원가입 중 오류 발생');
  }

  e.target.name.value = '';
  e.target.studentId.value = '';
  e.target.username.value = '';
  e.target.password.value = '';
  e.target.confirmPassword.value = '';
});

// ----------------------------
// 로그인 처리
document.getElementById('loginform').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = e.target.username.value;
  const password = e.target.password.value;

  if (!username) return alert('아이디를 입력하세요');
  if (!password) return alert('비밀번호를 입력하세요');

  try {
    const res = await axios.post('/users/login', { username, password });
    alert(res.data.message);
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.message || '로그인 실패');
  }

  e.target.username.value = '';
  e.target.password.value = '';
});

// ----------------------------
// 초기 사용자 목록 로딩
window.addEventListener('DOMContentLoaded', getUser);
