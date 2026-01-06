# Setup SES Permissions for Cognito Users

## Step 1: Find Your Cognito Identity Pool

1. Go to AWS Console → **Amazon Cognito** → **Identity pools (Federated Identities)**
2. Find your identity pool (likely named similar to your app)
3. Click on it
4. Note the **Identity pool ID** (looks like: `us-west-2:xxxxx-xxxx-xxxx-xxxx-xxxxxxxxx`)

## Step 2: Update the Authenticated Role

1. Click on **"Edit identity pool"** (top right)
2. Expand **Authentication providers**
3. Note the **Authenticated role ARN** (should look like: `arn:aws:iam::ACCOUNT:role/amplify-dragleague-XXXXX-authRole`)
4. Copy the role name from the ARN (the part after `role/`)

## Step 3: Add SES Permissions to the Role

1. Go to **AWS IAM Console** → **Roles**
2. Search for and click on the authenticated role (from step 2)
3. Click **Add permissions** → **Create inline policy**
4. Click **JSON** tab
5. Paste this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendTemplatedEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*"
    }
  ]
}
```

6. Click **Review policy**
7. Name it: `AllowSESEmailSending`
8. Click **Create policy**

## Step 4: Verify Your Sender Email in SES

Make sure `noreply@drag-league.com` is verified in SES:

1. Go to **Amazon SES** → **Verified identities**
2. If `noreply@drag-league.com` is not there, click **Create identity**
3. Choose **Email address**
4. Enter: `noreply@drag-league.com`
5. Click **Create identity**
6. Check your email for the verification link and click it

## Step 5: Test the Integration

1. Deploy your updated code
2. Sign in to your app
3. Go to a league page as an admin
4. Click the announcement button
5. Send a test message

## Troubleshooting

If you get errors:

- **"User is not authorized"**: IAM role permissions not applied correctly
- **"Email address not verified"**: Verify the sender email in SES
- **"Template does not exist"**: Run the `aws ses list-templates` command to verify templates exist
- **"Missing credentials"**: Make sure user is signed in with Cognito

## What This Does

- ✅ Bypasses CloudFront entirely (no more 403 errors)
- ✅ Uses beautiful SES email templates
- ✅ Secure - only authenticated Cognito users can send
- ✅ Scalable - SES handles email delivery
- ✅ No environment variables needed in deployment
