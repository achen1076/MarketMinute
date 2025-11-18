"""
One-time setup to authenticate with Schwab API.
This creates the schwab_token.json file needed for API calls.
"""
import os
from dotenv import load_dotenv
import schwab

load_dotenv()

def setup_schwab_authentication():
    """
    Interactive setup for Schwab OAuth authentication.
    This only needs to be run once.
    """
    print("="*70)
    print(" SCHWAB API AUTHENTICATION SETUP")
    print("="*70)
    print()
    
    app_key = os.getenv("SCHWAB_APP_KEY")
    app_secret = os.getenv("SCHWAB_APP_SECRET")
    
    if not app_key or not app_secret:
        print("❌ ERROR: SCHWAB_APP_KEY and SCHWAB_APP_SECRET not found in .env file")
        print()
        print("Add these to your .env file:")
        print("SCHWAB_APP_KEY=your_app_key")
        print("SCHWAB_APP_SECRET=your_app_secret")
        return
    
    print(f"✅ Found App Key: {app_key[:10]}...")
    print(f"✅ Found App Secret: {app_secret[:10]}...")
    print()
    
    # Check if token already exists
    if os.path.exists("schwab_token.json"):
        print("⚠️  schwab_token.json already exists!")
        response = input("Overwrite it? (y/n): ")
        if response.lower() != 'y':
            print("Aborted.")
            return
    
    print()
    print("Starting OAuth authentication flow...")
    print("This will open a browser window for you to log in to Schwab.")
    print()
    
    try:
        # Redirect URI (must match what you set in Schwab developer portal)
        redirect_uri = "https://localhost:8080"
        
        print(f"Redirect URI: {redirect_uri}")
        print()
        print("INSTRUCTIONS:")
        print("1. A browser will open")
        print("2. Log in to your Schwab account")
        print("3. Approve the API access")
        print("4. You'll be redirected to a blank page")
        print("5. Copy the ENTIRE URL from the browser")
        print("6. Paste it back here")
        print()
        
        # Use easy client authentication
        client = schwab.auth.easy_client(
            api_key=app_key,
            app_secret=app_secret,
            callback_url=redirect_uri,
            token_path="schwab_token.json"
        )
        
        print()
        print("="*70)
        print(" ✅ AUTHENTICATION SUCCESSFUL!")
        print("="*70)
        print()
        print("Token saved to: schwab_token.json")
        print("You can now run: python scripts/prep_data_for_institutional.py")
        print()
        
        # Test it
        print("Testing API access...")
        response = client.get_quote("AAPL")
        if response.status_code == 200:
            print("✅ API is working! Successfully fetched AAPL quote.")
        else:
            print(f"⚠️  API returned status code: {response.status_code}")
        
    except Exception as e:
        print()
        print("="*70)
        print(" ❌ AUTHENTICATION FAILED")
        print("="*70)
        print(f"Error: {e}")
        print()
        print("Common issues:")
        print("- Callback URL doesn't match your Schwab app settings")
        print("- App key/secret are incorrect")
        print("- Need to enable API access in Schwab developer portal")
        print()


if __name__ == "__main__":
    setup_schwab_authentication()
