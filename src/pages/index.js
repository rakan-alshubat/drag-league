import { withAuthenticator } from "@aws-amplify/ui-react"
import { defaultTheme, ThemeProvider } from "@aws-amplify/ui-react"

function Home(signOut, user) {
  return (
    <div>
      <h1>Welcome {user.username} </h1>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}

export default withAuthenticator(Home, {
  variation: 'modal',
});
