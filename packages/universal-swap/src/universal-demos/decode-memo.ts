import { Memo } from "../proto/universal_swap_memo";

(() => {
  const memo =
    "CoEBCgdvcmFpZGV4EnYKdAo/b3JhaS1vcmFpMTJoemp4Zmg3N3dsNTcyZ2R6Y3QyZnh2MmFyeGN3aDZneWtjN3FoLTMwMDAwMDAwMDAtMTAwEitvcmFpMTJoemp4Zmg3N3dsNTcyZ2R6Y3QyZnh2MmFyeGN3aDZneWtjN3FoGgRvcmFpEgk1MDUzODAwMjAYgJzA9dmxioMYIi8iLQorb3JhaTF1czR0c3gzcTVwNWdnand0MG5mdHNrdndueWNyMHFwdmdyYXNjbCorb3JhaTF1czR0c3gzcTVwNWdnand0MG5mdHNrdndueWNyMHFwdmdyYXNjbA==";
  // "CtMDCgdvcmFpZGV4GscDCsQDCgYyMzczNjcS9AEKf2liYy9BMkUyRUVDOTA1N0E0QTFDMkMwQTZBNEM3OEIwMjM5MTE4REY1RjI3ODgzMEY1MEI0QTZCREQ3QTY2NTA2Qjc4LW9yYWkxbHVzMGYwcmh4OHMwM2dkbGx4Mm42dmhrbWYwNTM2ZHY1N3dmZ2UtMzAwMDAwMDAwMC0xMDASRGliYy9BMkUyRUVDOTA1N0E0QTFDMkMwQTZBNEM3OEIwMjM5MTE4REY1RjI3ODgzMEY1MEI0QTZCREQ3QTY2NTA2Qjc4GitvcmFpMWx1czBmMHJoeDhzMDNnZGxseDJuNnZoa21mMDUzNmR2NTd3ZmdlEsIBCmZvcmFpMTJoemp4Zmg3N3dsNTcyZ2R6Y3QyZnh2MmFyeGN3aDZneWtjN3FoLW9yYWkxbHVzMGYwcmh4OHMwM2dkbGx4Mm42dmhrbWYwNTM2ZHY1N3dmZ2UtMzAwMDAwMDAwMC0xMDASK29yYWkxbHVzMGYwcmh4OHMwM2dkbGx4Mm42dmhrbWYwNTM2ZHY1N3dmZ2UaK29yYWkxMmh6anhmaDc3d2w1NzJnZHpjdDJmeHYyYXJ4Y3doNmd5a2M3cWgSBjQ3MzcyNRiAnLyrmIr9ghgiqQESpgEKCmNoYW5uZWwtMjkSLG9yYWliMWh2cjlkNzJyNXVtOWx2dDBycGtkNHI3NXZyc3F0dzZ5dG5udnBmGi9vcmFpYjB4NTVkMzk4MzI2Zjk5MDU5ZkY3NzU0ODUyNDY5OTkwMjdCMzE5Nzk1NSCAuI/AlYr9ghgqL29yYWliMHg4YzdFMEE4NDEyNjlhMDFjMEFiMzg5Q2U4RmIzQ2YxNTBBOTRFNzk3KitvcmFpMWh2cjlkNzJyNXVtOWx2dDBycGtkNHI3NXZyc3F0dzZ5dWpocXMy";
  const memo1 =
    "CpQICgdvcmFpZGV4GogICtkFCgg1NDMyNjI4MhL0AQp/aWJjL0EyRTJFRUM5MDU3QTRBMUMyQzBBNkE0Qzc4QjAyMzkxMThERjVGMjc4ODMwRjUwQjRBNkJERDdBNjY1MDZCNzgtb3JhaTFsdXMwZjByaHg4czAzZ2RsbHgybjZ2aGttZjA1MzZkdjU3d2ZnZS0zMDAwMDAwMDAwLTEwMBJEaWJjL0EyRTJFRUM5MDU3QTRBMUMyQzBBNkE0Qzc4QjAyMzkxMThERjVGMjc4ODMwRjUwQjRBNkJERDdBNjY1MDZCNzgaK29yYWkxbHVzMGYwcmh4OHMwM2dkbGx4Mm42dmhrbWYwNTM2ZHY1N3dmZ2US6gEKem9yYWkxNXVuOG1zeDNuNXpmOWFobHhtZmVxZDJrd2E1d20wbnJweGVyMzA0bTluZDVxNnFxMGc2c2t1NXBkZC1vcmFpMWx1czBmMHJoeDhzMDNnZGxseDJuNnZoa21mMDUzNmR2NTd3ZmdlLTMwMDAwMDAwMDAtMTAwEitvcmFpMWx1czBmMHJoeDhzMDNnZGxseDJuNnZoa21mMDUzNmR2NTd3ZmdlGj9vcmFpMTV1bjhtc3gzbjV6ZjlhaGx4bWZlcWQya3dhNXdtMG5ycHhlcjMwNG05bmQ1cTZxcTBnNnNrdTVwZGQS6AEKeG9yYWkxMmh6anhmaDc3d2w1NzJnZHpjdDJmeHYyYXJ4Y3doNmd5a2M3cWgtb3JhaTE1dW44bXN4M241emY5YWhseG1mZXFkMmt3YTV3bTBucnB4ZXIzMDRtOW5kNXE2cXEwZzZza3U1cGRkLTUwMDAwMDAwMC0xMBI/b3JhaTE1dW44bXN4M241emY5YWhseG1mZXFkMmt3YTV3bTBucnB4ZXIzMDRtOW5kNXE2cXEwZzZza3U1cGRkGitvcmFpMTJoemp4Zmg3N3dsNTcyZ2R6Y3QyZnh2MmFyeGN3aDZneWtjN3FoCqkCCgg1NDMyNjI4MxKmAQpYaWJjL0EyRTJFRUM5MDU3QTRBMUMyQzBBNkE0Qzc4QjAyMzkxMThERjVGMjc4ODMwRjUwQjRBNkJERDdBNjY1MDZCNzgtb3JhaS0zMDAwMDAwMDAwLTEwMBJEaWJjL0EyRTJFRUM5MDU3QTRBMUMyQzBBNkE0Qzc4QjAyMzkxMThERjVGMjc4ODMwRjUwQjRBNkJERDdBNjY1MDZCNzgaBG9yYWkSdAo/b3JhaS1vcmFpMTJoemp4Zmg3N3dsNTcyZ2R6Y3QyZnh2MmFyeGN3aDZneWtjN3FoLTMwMDAwMDAwMDAtMTAwEgRvcmFpGitvcmFpMTJoemp4Zmg3N3dsNTcyZ2R6Y3QyZnh2MmFyeGN3aDZneWtjN3FoEhLbtNu427nbttuz27TbsNu427gYgICLirX+5YIYIqkBEqYBCgpjaGFubmVsLTI5EixvcmFpYjFmdmpsZXluMDVwczJscmwyajM2cHQ1djIzenRnZnAyNjUwNWx2Nxovb3JhaWIweDU1ZDM5ODMyNmY5OTA1OWZGNzc1NDg1MjQ2OTk5MDI3QjMxOTc5NTUggOyV37T+5YIYKi9vcmFpYjB4NjA5RWE2YzQ0MDkyZTYwODM4ZDhEOTZDQzVCYjljOURiMzFiMzE1YSorb3JhaTFmdmpsZXluMDVwczJscmwyajM2cHQ1djIzenRnZnAyNnJ3c25hYQ==";

  const encodedMemo = Memo.decode(Buffer.from(memo, "base64"));
  const encodedMemo1 = Memo.decode(Buffer.from(memo1, "base64"));
  console.dir(
    {
      encodedMemo,
      encodedMemo1
    },
    { depth: null }
  );
})();
