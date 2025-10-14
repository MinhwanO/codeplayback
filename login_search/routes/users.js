const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const router = express.Router();

// 회원 전체 조회
router.route('/')
  .get(async (req, res, next) => {
    try {
      const users = await User.findAll();
      res.json(users);
    } catch (err) {
      console.error(err);
      next(err);
    }
  })
  
// 회원가입
router.post('/register', async (req, res) => {
  try {
    const { name, studentId, username, password, confirmPassword } = req.body;
    if (!name || !studentId || !username || !password || !confirmPassword)
      return res.status(400).json({ message: '모든 필드를 입력해주세요.' });

    if (password !== confirmPassword)
      return res.status(400).json({ message: '비밀번호가 일치하지 않습니다.' });

    const exist = await User.findOne({ where: { username } });
    if (exist) return res.status(400).json({ message: '이미 존재하는 아이디입니다.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, studentId, username, password: hashedPassword });

    res.status(201).json({ message: '회원가입 성공', user });
  } catch (err) { console.error(err); res.status(500).send('서버 오류'); }
});

// 로그인 + JWT 발급
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(400).json({ message: '아이디를 찾을 수 없습니다.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: '비밀번호가 틀렸습니다.' });

    const token = jwt.sign({ username: user.username }, 'team2-key', { expiresIn: '1h' });
    res.json({ message: `${user.name}님 로그인 성공!`, user, token });
  } catch (err) { console.error(err); res.status(500).send('서버 오류'); }
});

/*
// 친구 추가 (서로 친구됨)
router.post('/add_friend', async (req, res) => {
  try {
    const { nickname: friendNickname } = req.body;
    const token = req.headers.token;
    if (!token) return res.status(401).send('토큰이 없습니다.');

    // JWT 복호화
    const payload = jwt.verify(token, 'team2-key');
    const userA = await User.findOne({ where: { username: payload.username } }); // 나
    if (!userA) return res.status(404).send('사용자를 찾을 수 없습니다.');

    // 1️⃣ 자기 자신 추가 방지
    if (userA.username === friendNickname) {
      return res.status(400).send('자기 자신은 친구로 추가할 수 없습니다.');
    }

    // 2️⃣ 추가하려는 사용자가 실제 존재하는지 확인
    const userB = await User.findOne({ where: { username: friendNickname } });
    if (!userB) {
      return res.status(404).send('존재하지 않는 사용자입니다.');
    }

    // 3️⃣ 기존 친구 목록 가져오기
    let friendsA = Array.isArray(userA.friend_list) ? [...userA.friend_list] : [];
    let friendsB = Array.isArray(userB.friend_list) ? [...userB.friend_list] : [];

    // 4️⃣ 이미 친구인지 확인
    if (friendsA.includes(friendNickname)) {
      return res.send('이미 친구입니다.');
    }

    // 5️⃣ 서로 친구 추가
    friendsA.push(friendNickname);
    friendsB.push(userA.username);

    // 6️⃣ DB에 양쪽 다 반영
    await Promise.all([
      User.update({ friend_list: friendsA }, { where: { username: userA.username } }),
      User.update({ friend_list: friendsB }, { where: { username: userB.username } }),
    ]);

    res.send(`'${friendNickname}'님과 친구가 되었습니다!`);
  } catch (err) {
    console.error(err);
    res.status(500).send('서버 오류');
  }
});*/

// 친구 추가 (이름 + 학번 필요, 양방향)
router.post('/add_friend', async (req, res) => {
  try {
    const { name, studentId } = req.body;
    const token = req.headers.token;
    if (!token) return res.status(401).send('토큰이 없습니다.');

    // JWT 복호화
    const payload = jwt.verify(token, 'team2-key');
    const userA = await User.findOne({ where: { username: payload.username } });
    if (!userA) return res.status(404).send('사용자를 찾을 수 없습니다.');

    // 1️⃣ 이름 + 학번으로 친구 검색
    const userB = await User.findOne({ where: { name, studentId } });
    if (!userB) return res.status(404).send('해당 이름+학번 사용자를 찾을 수 없습니다.');

    // 2️⃣ 자기 자신 방지
    if (userA.username === userB.username) {
      return res.status(400).send('자기 자신은 친구로 추가할 수 없습니다.');
    }

    // 3️⃣ 기존 친구 목록
    let friendsA = Array.isArray(userA.friend_list) ? [...userA.friend_list] : [];
    let friendsB = Array.isArray(userB.friend_list) ? [...userB.friend_list] : [];

    // 4️⃣ 이미 친구인지 확인
    if (friendsA.includes(userB.username)) return res.send('이미 친구입니다.');

    // 5️⃣ 양쪽 친구 추가
    friendsA.push(userB.username);
    friendsB.push(userA.username);

    // 6️⃣ DB 업데이트
    await Promise.all([
      User.update({ friend_list: friendsA }, { where: { username: userA.username } }),
      User.update({ friend_list: friendsB }, { where: { username: userB.username } }),
    ]);

    res.send(`'${userB.name}'님과 친구가 되었습니다!`);
  } catch (err) {
    console.error(err);
    res.status(500).send('서버 오류');
  }
});

// 친구 삭제 (양방향)
router.post('/remove_friend', async (req, res) => {
  try {
    const { username: friendUsername } = req.body;
    const token = req.headers.token;
    if (!token) return res.status(401).send('토큰이 없습니다.');

    // JWT 복호화
    const payload = jwt.verify(token, 'team2-key');
    const userA = await User.findOne({ where: { username: payload.username } });
    const userB = await User.findOne({ where: { username: friendUsername } });
    if (!userA || !userB) return res.status(404).send('사용자를 찾을 수 없습니다.');

    // 친구 목록 제거
    let friendsA = Array.isArray(userA.friend_list) ? [...userA.friend_list] : [];
    let friendsB = Array.isArray(userB.friend_list) ? [...userB.friend_list] : [];

    friendsA = friendsA.filter(u => u !== userB.username);
    friendsB = friendsB.filter(u => u !== userA.username);

    // DB 업데이트
    await Promise.all([
      User.update({ friend_list: friendsA }, { where: { username: userA.username } }),
      User.update({ friend_list: friendsB }, { where: { username: userB.username } }),
    ]);

    res.send(`'${userB.name}'님과의 친구 관계를 삭제했습니다.`);
  } catch (err) {
    console.error(err);
    res.status(500).send('서버 오류');
  }
});



// 내 친구 목록 조회
router.get('/my_friend_list_show', async (req, res) => {
  try {
    const token = req.headers.token;
    if (!token) return res.status(401).send('토큰이 없습니다.');

    const payload = jwt.verify(token, 'team2-key');
    const user = await User.findOne({ where: { username: payload.username } });
    if (!user) return res.status(404).send('사용자를 찾을 수 없습니다.');

    res.json({ my_friend_list_show: user.friend_list || [] });
  } catch (err) { console.error(err); res.status(500).send('서버 오류'); }
});

module.exports = router;