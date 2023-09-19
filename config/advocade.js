module.exports = {
  LIMIT_SMS_CHARACTERS:{
    ENGLISH: {
      LENGTH_OF_SMS: 160,
      TRIM_CHARACTER: 25,
      LIMIT: 135
    },
    OTHERS: {
      LENGTH_OF_SMS:70,
      TRIM_CHARACTER: 0, // Don't have unsub with other country ( SINGAPOREAN ONLY)
      LIMIT:70
    }
  }
}


// Node that limit english sms provider is 160 per 1 sms ,
// 25 is length of unsublength text -> Need to change LIMIT when unsublength change
// 160 - 25 = 135 Limit