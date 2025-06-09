/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  await knex("User").del();
  await knex("User").insert([
    {
      UserId: knex.raw("gen_random_uuid()"),
      Username: "bobmarley",
      UsernameShow: "Bob Marley",
      PasswordHash: "password_hash1",
      Email: "bobmarley@example.com",
      UpdatedAt: new Date("2025-04-30T10:00:00Z"),
      PublicKey:
        "-----BEGIN PUBLIC KEY-----MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqO+9HhWx8Lbp/Ftk5+w+EiCCcZCQnRd27ohhU2GQujg8I4qfMp1O/cwHdgNDGV1bJpQ2FIAipEIAvywkxd0SzLoD7BC+kMq6W9wCy3jOZWNGeEw1YfZidmHTtLuUQ6LF7AlQ34mmNh8qvIvnJQpVg5DKgraALoO6DrV/4ra5nlvNt6uq/SrbmoiqFk0JeZPRuQgwQ5GHHUHU9QYygZXJAwiktA3u9Dts8qUFykwx9JaZtnllqJ9wG90yLp8C3xAWk1DKWhwQXzZIknLOV1YfeYh6Mm2Qne9sM8twKH3RAoiIsG+vSLb9AqwtugQ0saZrCbAuQQo3/1rFonNWWhcI-----END PUBLIC KEY-----",
      PrivateKey:
        "-----BEGIN PRIVATE KEY-----MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCo770eFbHwtun8W2Tn7D4SIIJxkJCdF3buiGFTYZC6ODwjip8ynU79zAd2A0MZXVsmlDYUgCKkQgC/LCTF3RLMugPsEL6Qyrpb3ALLeM5lY0Z4TDVh9mJ2YdO0u5RDosXsCVDfiaY2Hyq8i+clClWDkMqCtoAug7oOtX/itrmeW823q6r9KtuaiKoWTQl5k9G5CDBDkYcdQdT1BjKBlckDCKS0De70O2zypQXKTDH0lpm2eWWon3Ab3TIunwLfEBaTUMpaHBBfNkiScs5XVh95iHoybZCd72wzy3AofdECiIiwb69Itv0CrC26BDSxpmsJsC5BCjf/WsWic1ZaFwhFAgMBAAECggEAQX6wkzlWAzzm+i90r3Wnmt9/sweZCU5PjarSEMGCmq+yoRTdI4JZXYv8WIRrPyoybIKJdOk4hPYR1AwJNay/3R9A5gSX3Qq7tWFWtAvh+OzEJV9mUtRy1/KVYTxX/uDcWuZBtGhpSBJNP0v+ER4wiRFZcdPPXjkzqQA01HCDBiFwBwgWC10d15FZzC7WpV2lL5lqHMcN2IpISvQoQT3KDK3WTbmXvecJTZkPH+FRw3ez0qpN1X0NRuAp/eu74SDSBdoJTKj5xxq2BFsZRKtKHDWY/Z6phgPiPXUWwDs97MiZIasLL1KUKrbi8iZUYtwxZfjk0WG64PbGX/Y+x+vPAQKBgQDXSbF3BlfIHLm1oP++YDtY7nP8BAcTzLcEtqE9LDAVRf9NibBXVmsE6TnDZuT51rhOWWO0wuRucxo2qL5RU6wLYh7azr5eqfkvxeayS7ck8GdDqBbzDAZ8RQ2zYmCFmfJtHvyVmChEmbDSnRaM2umN8unrCxCP9p1ipWhd+jOzQwKBgQDI4iCZpv6ChG0WVkNFF4dwRmbOdoBZM+0kgNkoYekii3dBSShWkt07A0TssjrewjTKSrnL+4uVSYNL0woGiIW0ZPud57dC9N760tK+OVvESzp4cUYZp2B4n9YJnfQLKp3JP4NqB099wdufDVvbVUfxs7A6uXSyUwpe4+2kkHdp1wKBgEkO2QprPJ7MILliSWdxgLJNOU7sjvpJHlKbJ1x7AlY1ys2lTBJXYTnpa5DD+jBOjX0JGKze9mYE6YBjAzLWEixKv+3A+xlk1QtBPWiECUKf0mtDP4Z7Ljg9tsiJOfgcpggh29VoLUIaZccTR/PE1j01kewRdS1lo0M2npRFtAXBAoGAPUXsF7H+M6Vc+NE7F5oDr9VpilRO9eaG0PmUQ2MKD4VmzL0Z1r5ZSKTIo0IB/uxR2dpNLdD+VHzl1Xz7s950mf+rWBDTr1KtqOgha/Bm80rW/OHgNfb90A1A5hIN3FIVass6tF6ieoNlD/CtMgujNDBQ8riaxcHaifMQC4AdTGUCgYEAhCQQhPCvyw1Op244r4p/8L+3eVHUBl2m0A/Vre2+G8w/8nD7DSuTDkDIuE4pY1pbz/DY95lJTFEXWGCuIBE0QF/DLvT0+KxpKgy33XUYAFuD0OXU6q2YI7XH0bWgRLG1TBhPb4nag3BXbgyxs0P0HyixPudVJx+w9RTUjYRjJN0=-----END PRIVATE KEY-----",
    },
    {
      UserId: knex.raw("gen_random_uuid()"),
      Username: "alicejenson",
      UsernameShow: "Alice Jenson",
      PasswordHash: "password_hash2",
      Email: "alicejenson@example.com",
      UpdatedAt: new Date("2025-04-30T11:00:00Z"),
      PublicKey:
        "-----BEGIN PUBLIC KEY-----MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAi/o+tx+aQy6ZdHhE6ouhoP8O18oPr1lYSxxPtJgr7Oq5/ajCVsMOdJNXYI0URmszQf4S3ei/Ziy0JSagMTpePfU4FKpq1TPopLblUN6q1x8GvNfr31O6/cB+SnThq505mSqp0peQNCbXVLGemDtn9Q312s/pyPUnI2AlWWbM3kHogMu5yiwgJ8gPOCOQtlqqR+v0pwOmrxVOH65OMSF9/et4jbdg/fvxSjUT929jHtjcbqKyDDf+yne+CNM6YccrcT2TCFYfuEyymcsM9s8q2c3tQEUrZzL0BcRSo6smyouBuNbIZLe+fqp5xFdyMwKO/K6nO7V4v/xgcbaanDZfzQIDAQAB-----END PUBLIC KEY-----",
      PrivateKey:
        "-----BEGIN PRIVATE KEY-----MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCL+j63H5pDLpl0eETqi6Gg/w7Xyg+vWVhLHE+0mCvs6rn9qMJWww50k1dgjRRGazNB/hLd6L9mLLQlJqAxOl499TgUqmrVM+iktuVQ3qrXHwa81+vfU7r9wH5KdOGrnTmZKqnSl5A0JtdUsZ6YO2f1DfXaz+nI9ScjYCVZZszeQeiAy7nKLCAnyA84I5C2WqpH6/SnA6avFU4frk4xIX3963iNt2D9+/FKNRP3b2Me2NxuorIMN/7Kd74I0zphxytxPZMIVh+4TLKZywz2zyrZze1ARStnMvQFxFKjqybKi4G41shkt75+qnnEV3IzAo78rqc7tXi//GBxtpqcNl/NAgMBAAECggEAAvoqBSdAVsn3XG1mGoP+Rn2Y9qOBqmXbgCYkbC+pYthfki2ES/1Jlyv+xDBepvHG7RIm8L6E0FBGmPIFnw5srI4vk2xIKevjo0SQQ4783LxNnnd245uKYwp0qoeVDjChpehCT5bxgP52KYMT9Q0cagSnlEVu+vB7P4rJuJP8awS9S/1SdpWXlzChw6KaIAhe4d6J6KIIpLTxMieduvL9VDU/f/8JbQHeAWrn9cUpVtWRxPte0BSa+qQe4LbHPWOIH1ZcAaSC9tSEaQHJ+roXWmkgp6QAuX3s5nqcwzuF+LsIkno9Ptk7zyJUL8zgjCcdXWCjByqMldB+2qroO3IRwQKBgQDA5h1996UQJ7u4U7riVmnQwBtoH9xzZ7hwZ/PbGipQN6nSwXUSQMT4FKipD1702KjuNT0Is54vtF2QDpSjXanyL5WMVk+njcXWdhVGowtEMwG5h8SAMGVTLGfGXOaMIPR8MdY34IaecMXPw07sG+pf0q69DbC80vhimNG5dhnMQQKBgQC5xFk1w30BgDbFrdeLtzlFecePW76aliaBuCFRTOt3M0HHHfan7Rw3+3QDkW7izd0sw8FvWcdrxoPuT2a2NO6O0WKaQxBKZ2GcPQSUoVi5NjxjVHkxvhF+TxEc9seQ/T5xtqoszlyfXe0dUNXFZluZBwNYVR90pZL/VRqly0jgjQKBgQC7lUtquw8+RZVMK8hZ4DSodphwSkODyoJWdRBzqd8qAOdZdx2UsX2ZzeUx+iuaKLMmaok+1ATpWRl/RF6Q+z2PsWxZe3mcc8bGxi/scBM9r+hmdjvFeMqf9le4U5EzBb0apRAvaF0g6IPEhaZS/taNdoDMgeqzxOkcYIXaN5ngwQKBgDkiBj3ezcd0Y2QQv0YdJ+QSPCn/EXQB0f37X2PdwF18yjIvKPkkl5UwJNIkHHJs1iU6X3ebqRWgjFry2KgZR3VtOGIxVgVMHl0q9wmvRdZQs+noxQ1jY4XxU1YRH/ebq2TVxSjanun0vURS5Cw9+tXprkGwjGgXtEoLJpLvHo7RAoGAWkrx+HvCLkKTcGLWuQU8gtme1m/6o5r7hhEzjMdE2wQy5rVE3X6vuDnTYG5pzEr7fdi0faLWUUKrGCEk3bfqH1amc7nbtN7RGf96kaCl3Ew5oB/BlSe7XclOTskhViQcUOIIy19OI9x9ZvdW+wlAoykiIvQAOBA99jpXia9Sy5Q=-----END PRIVATE KEY-----",
    },
  ]);
};
