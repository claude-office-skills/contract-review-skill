"""
OpenLaws API Connector

OpenLaws provides access to 4.3+ million sections of US federal and state law.
API Documentation: https://openlaws.apidocumentation.com/

To use:
1. Request free API access at https://openlaws.us/api/
2. Set OPENLAWS_API_KEY environment variable
3. Import and use the connector

Example:
    from openlaws_connector import OpenLawsConnector
    
    connector = OpenLawsConnector()
    results = connector.search("minimum wage", jurisdiction="federal")
    statute = connector.get_by_citation("29 U.S.C. § 206")
"""

import os
import requests
from typing import Optional, Dict, List, Any

try:
    from .connector_template import BaseKnowledgeConnector
except ImportError:
    from connector_template import BaseKnowledgeConnector


class OpenLawsConnector(BaseKnowledgeConnector):
    """Connector for OpenLaws Legal Data API."""
    
    BASE_URL = "https://api.openlaws.us/v1"
    
    def __init__(self, api_key: Optional[str] = None, config: Optional[Dict] = None):
        super().__init__(api_key, config)
        self.api_key = api_key or os.getenv("OPENLAWS_API_KEY")
        
    @property
    def name(self) -> str:
        return "OpenLaws Legal Data API"
    
    @property
    def supported_jurisdictions(self) -> List[str]:
        return [
            "US-Federal",
            "US-AL", "US-AK", "US-AZ", "US-AR", "US-CA", "US-CO", "US-CT", "US-DE",
            "US-FL", "US-GA", "US-HI", "US-ID", "US-IL", "US-IN", "US-IA", "US-KS",
            "US-KY", "US-LA", "US-ME", "US-MD", "US-MA", "US-MI", "US-MN", "US-MS",
            "US-MO", "US-MT", "US-NE", "US-NV", "US-NH", "US-NJ", "US-NM", "US-NY",
            "US-NC", "US-ND", "US-OH", "US-OK", "US-OR", "US-PA", "US-RI", "US-SC",
            "US-SD", "US-TN", "US-TX", "US-UT", "US-VT", "US-VA", "US-WA", "US-WV",
            "US-WI", "US-WY", "US-DC"
        ]
    
    def _make_request(self, endpoint: str, params: Optional[Dict] = None) -> Dict:
        """Make an authenticated API request."""
        if not self.api_key:
            raise ValueError(
                "OpenLaws API key not set. "
                "Get a free key at https://openlaws.us/api/ and set OPENLAWS_API_KEY"
            )
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(
            f"{self.BASE_URL}/{endpoint}",
            headers=headers,
            params=params,
            timeout=30
        )
        response.raise_for_status()
        return response.json()
    
    def search(
        self, 
        query: str, 
        jurisdiction: str = "federal",
        limit: int = 10,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """
        Search for laws matching the query.
        
        Args:
            query: Search terms
            jurisdiction: "federal" or state code (e.g., "CA", "NY")
            limit: Maximum number of results
            
        Returns:
            List of matching law sections
        """
        params = {
            "q": query,
            "jurisdiction": jurisdiction,
            "limit": limit,
            **kwargs
        }
        
        try:
            result = self._make_request("search", params)
            return result.get("results", [])
        except Exception as e:
            print(f"OpenLaws search error: {e}")
            return []
    
    def get_by_citation(self, citation: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a specific law by Bluebook citation.
        
        Args:
            citation: Bluebook citation (e.g., "29 U.S.C. § 206")
            
        Returns:
            Law text and metadata, or None if not found
        """
        params = {"citation": citation}
        
        try:
            result = self._make_request("citation", params)
            return result
        except requests.HTTPError as e:
            if e.response.status_code == 404:
                return None
            raise
    
    def get_statute_text(self, title: int, section: int, jurisdiction: str = "usc") -> Optional[str]:
        """
        Get the text of a specific statute.
        
        Args:
            title: Title number (e.g., 29 for labor law)
            section: Section number (e.g., 206 for minimum wage)
            jurisdiction: "usc" for US Code, or state code
            
        Returns:
            Statute text or None
        """
        citation = f"{title} U.S.C. § {section}" if jurisdiction == "usc" else f"{jurisdiction} § {section}"
        result = self.get_by_citation(citation)
        return result.get("text") if result else None
    
    def get_flsa_provisions(self) -> Dict[str, Any]:
        """
        Get key FLSA (Fair Labor Standards Act) provisions.
        
        Returns:
            Dictionary of FLSA sections
        """
        flsa_sections = {
            "minimum_wage": "29 U.S.C. § 206",
            "overtime": "29 U.S.C. § 207",
            "child_labor": "29 U.S.C. § 212",
            "recordkeeping": "29 U.S.C. § 211",
            "definitions": "29 U.S.C. § 203"
        }
        
        results = {}
        for name, citation in flsa_sections.items():
            data = self.get_by_citation(citation)
            if data:
                results[name] = {
                    "citation": citation,
                    "text": data.get("text", ""),
                    "last_updated": data.get("last_amended", "")
                }
        
        return results


# Convenience function for quick lookups
def lookup_us_law(citation: str, api_key: Optional[str] = None) -> Optional[Dict]:
    """
    Quick lookup of a US law citation.
    
    Args:
        citation: Bluebook citation
        api_key: Optional API key (defaults to env var)
        
    Returns:
        Law data or None
    """
    connector = OpenLawsConnector(api_key=api_key)
    return connector.get_by_citation(citation)


if __name__ == "__main__":
    # Example usage (requires API key)
    import json
    
    connector = OpenLawsConnector()
    
    print("Supported jurisdictions:", len(connector.supported_jurisdictions))
    print("\nTo use this connector, set OPENLAWS_API_KEY environment variable.")
    print("Get a free key at: https://openlaws.us/api/")
