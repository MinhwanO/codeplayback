const express = require('express');
const bcrypt = require('bcryptjs');
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
  .post(async (req, res, next) => {
    try {
      const { name, studentId, username, password, confirmPassword } = req.body;

      if (!name || !studentId || !username || !password || !confirmPassword) {
        return res.status(400).json({ message: '모든 필드를 입력해주세요.' });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ message: '비밀번호가 일치하지 않습니다.' });
      }

      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        return res.status(400).json({ message: '이미 존재하는 아이디입니다.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
        name,
        studentId,
        username,
        password: hashedPassword,
      });

      console.log('회원가입 성공:', user.username);
      res.status(201).json({ message: '회원가입 성공', user });
    } catch (err) {
      console.error(err);
      next(err);
    }
  });

// 로그인
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const exUser = await User.findOne({ where: { username } });
    if (!exUser) {
      return res.status(400).json({ message: '아이디를 찾을 수 없습니다.' });
    }

    const match = await bcrypt.compare(password, exUser.password);
    if (!match) {
      return res.status(400).json({ message: '비밀번호가 틀렸습니다.' });
    }

    console.log('로그인 성공:', exUser.username);
    res.json({ message: `${exUser.name}님 로그인 성공!`, user: exUser });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

module.exports = router;
