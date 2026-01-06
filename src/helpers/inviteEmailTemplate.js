/**
 * Generate HTML and plain text email templates for league invitations
 * @param {string} inviterName - Name of the person sending the invite
 * @param {string} leagueName - Name of the league
 * @param {string} inviteLink - Full URL to join the league
 * @returns {object} { html: string, text: string }
 */
export function generateInviteEmail({ inviterName, leagueName, inviteLink }) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f4;">
        <tr>
            <td style="padding: 20px 0;">
                <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #FF1493 0%, #9B30FF 50%, #FFD700 100%); padding: 30px 20px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                                🏁 Drag League Invitation
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">Hi there!</p>
                            
                            <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">
                                <strong style="color: #1a1a1a;">${inviterName}</strong> has invited you to join 
                                <strong style="color: #1a1a1a;">${leagueName}</strong> on Drag League!
                            </p>
                            
                            <p style="margin: 0 0 30px 0; font-size: 16px; color: #555;">
                                Join the competition to rank queens, predict winners, and compete with your friends throughout the season.
                            </p>
                            
                            <!-- CTA Button -->
                            <table role="presentation" style="margin: 0 auto;">
                                <tr>
                                    <td style="text-align: center; padding: 20px 0;">
                                        <a href="${inviteLink}" 
                                           style="background: linear-gradient(135deg, #FF1493 0%, #C71585 100%); color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(255, 20, 147, 0.4); text-shadow: 0 1px 2px rgba(0,0,0,0.2);">
                                            Accept Invitation
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Fallback Link -->
                            <p style="margin: 30px 0 0 0; padding: 20px; background-color: #fff5f8; border-radius: 8px; font-size: 14px; color: #666; border-left: 4px solid #FF1493;">
                                <strong style="color: #FF1493;">Button not working?</strong><br>
                                Copy and paste this link into your browser:<br>
                                <a href="${inviteLink}" style="color: #FF1493; word-break: break-all; font-weight: 600;">${inviteLink}</a>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px; background-color: #f9f9f9; border-top: 1px solid #e0e0e0;">
                            <p style="margin: 0 0 10px 0; font-size: 12px; color: #999; text-align: center; line-height: 1.5;">
                                This is an automated notification from Drag League.<br>
                                If you didn't expect this invitation, you can safely ignore this email.
                            </p>
                            <p style="margin: 15px 0 0 0; font-size: 12px; text-align: center;">
                                <a href="https://drag-league.com/Support" style="color: #FF1493; text-decoration: underline; font-weight: 600;">Contact Support</a>
                                <span style="color: #ccc; margin: 0 8px;">|</span>
                                <a href="https://drag-league.com/FAQ" style="color: #FF1493; text-decoration: underline; font-weight: 600;">FAQ</a>
                            </p>
                            <p style="margin: 15px 0 0 0; font-size: 11px; color: #aaa; text-align: center;">
                                © ${new Date().getFullYear()} Drag League. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();

    const text = `
🏁 DRAG LEAGUE INVITATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hi there!

${inviterName} has invited you to join "${leagueName}" on Drag League!

Join the competition to rank queens, predict winners, and compete with your friends throughout the season.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔗 ACCEPT YOUR INVITATION:
${inviteLink}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is an automated notification from Drag League.
If you didn't expect this invitation, you can safely ignore this email.

Need help? Visit: https://drag-league.com/Support
Have questions? Check our FAQ: https://drag-league.com/FAQ

© ${new Date().getFullYear()} Drag League. All rights reserved.
    `.trim();

    return { html, text };
}
