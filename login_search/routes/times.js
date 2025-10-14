const express = require('express');
const classTime = require('../models/time');
const sequelize = require('sequelize');
const Op = sequelize.Op;

const router = express.Router();

router.get('/:timename', async (req, res, next) => {
  try {
    const timee = await classTime.findAll({
        where: { name: {
            [Op.like]: "%" + req.params.timename +"%"
            }
        },
        raw: true
    });
    console.log(timee);
    res.json(timee);
  } catch (err) {
    console.error(err);
    next(err);
  }
});
module.exports = router;