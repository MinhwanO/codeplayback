const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const router = express.Router();

// ================== 회원 전체 조회 ==================
router.route('/')
  .get(async (req, res, next) => {
    try {
      const users = await User.findAll();
      res.json(users);
    } catch (err) {
      console.error(err);
      next(err);
    }
  });

// ================== 회원가입 ==================
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
    const user = await User.create({ 
      name, 
      studentId, 
      username, 
      password: hashedPassword,
      profileImage: '/images/default.jpg' // 기본 프로필 이미지
    });

    res.status(201).json({ message: '회원가입 성공', user });
  } catch (err) {
    console.error(err); 
    res.status(500).send('서버 오류'); 
  }
});

// ================== 로그인 ==================
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(400).json({ message: '아이디를 찾을 수 없습니다.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: '비밀번호가 틀렸습니다.' });

    const token = jwt.sign({ username: user.username }, 'team2-key', { expiresIn: '1h' });

    res.json({
      message: `${user.name}님 로그인 성공!`,
      user: {
        username: user.username,
        name: user.name,
        studentId: user.studentId,
        profileImage: user.profileImage // 로그인 시 이미지 포함
      },
      token
    });
  } catch (err) { 
    console.error(err); 
    res.status(500).send('서버 오류'); 
  }
});

// ================== 프로필 이미지 예시 가져오기 ==================
router.get('/example-images', (req, res) => {
  const images = [1,2,3,4,5].map(i => ({
    id: i,
    url: `/images/${i}.jpg`
  }));
  res.json(images);
});

// ================== 내 프로필 이미지 조회 ==================
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.token;
    if (!token) return res.status(401).send('토큰이 없습니다.');

    const payload = jwt.verify(token, 'team2-key');
    const user = await User.findOne({ where: { username: payload.username } });
    if (!user) return res.status(404).send('사용자를 찾을 수 없습니다.');

    res.json({ profileImage: user.profileImage });
  } catch (err) {
    console.error(err);
    res.status(500).send('서버 오류');
  }
});

// ================== 프로필 이미지 변경 ==================
router.post('/profile', async (req, res) => {
  try {
    const token = req.headers.token;
    const { imageId } = req.body;
    if (!token) return res.status(401).send('토큰이 없습니다.');
    if (!imageId || imageId < 1 || imageId > 5)
      return res.status(400).json({ error: 'Invalid imageId' });

    const payload = jwt.verify(token, 'team2-key');
    const user = await User.findOne({ where: { username: payload.username } });
    if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });

    user.profileImage = `/images/${imageId}.jpg`;
    await user.save();

    res.json({ message: '프로필 이미지가 변경되었습니다.', imageUrl: user.profileImage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류' });
  }
});


// 친구 추가 (이름 + 학번 필요, 양방향)
router.post('/add_friend', async (req, res) => {
  try {
    const { name, studentId } = req.body;
    const token = req.headers.token;
    if (!token) return res.status(401).send('토큰이 없습니다.');

    const payload = jwt.verify(token, 'team2-key');
    const userA = await User.findOne({ where: { username: payload.username } });
    if (!userA) return res.status(404).send('사용자를 찾을 수 없습니다.');

    const userB = await User.findOne({ where: { name, studentId } });
    if (!userB) return res.status(404).send('해당 이름+학번 사용자를 찾을 수 없습니다.');

    if (userA.username === userB.username) {
      return res.status(400).send('자기 자신은 친구로 추가할 수 없습니다.');
    }

    let friendsA = Array.isArray(userA.friend_list) ? [...userA.friend_list] : [];
    let friendsB = Array.isArray(userB.friend_list) ? [...userB.friend_list] : [];

    if (friendsA.includes(userB.username)) return res.send('이미 친구입니다.');

    friendsA.push(userB.username);
    friendsB.push(userA.username);

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

    const payload = jwt.verify(token, 'team2-key');
    const userA = await User.findOne({ where: { username: payload.username } });
    const userB = await User.findOne({ where: { username: friendUsername } });
    if (!userA || !userB) return res.status(404).send('사용자를 찾을 수 없습니다.');

    let friendsA = Array.isArray(userA.friend_list) ? [...userA.friend_list] : [];
    let friendsB = Array.isArray(userB.friend_list) ? [...userB.friend_list] : [];

    friendsA = friendsA.filter(u => u !== userB.username);
    friendsB = friendsB.filter(u => u !== userA.username);

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

