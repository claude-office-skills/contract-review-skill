"""
Template for creating external knowledge connectors.

To create a new connector:
1. Copy this file and rename it (e.g., my_connector.py)
2. Implement the required methods
3. Register in connectors.json
4. Submit a PR
"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, List, Any


class BaseKnowledgeConnector(ABC):
    """Base class for external knowledge connectors."""
    
    def __init__(self, api_key: Optional[str] = None, config: Optional[Dict] = None):
        """
        Initialize the connector.
        
        Args:
            api_key: Optional API key for authenticated services
            config: Optional configuration dictionary
        """
        self.api_key = api_key
        self.config = config or {}
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Return the connector name."""
        pass
    
    @property
    @abstractmethod
    def supported_jurisdictions(self) -> List[str]:
        """Return list of supported jurisdictions."""
        pass
    
    @abstractmethod
    def search(self, query: str, **kwargs) -> List[Dict[str, Any]]:
        """
        Search the knowledge base.
        
        Args:
            query: Search query string
            **kwargs: Additional search parameters
            
        Returns:
            List of search results
        """
        pass
    
    @abstractmethod
    def get_by_citation(self, citation: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a specific document by citation.
        
        Args:
            citation: Legal citation (e.g., "29 U.S.C. § 201")
            
        Returns:
            Document data or None if not found
        """
        pass
    
    def get_risk_patterns(self, jurisdiction: str, contract_type: str) -> List[Dict]:
        """
        Get jurisdiction-specific risk patterns.
        
        Args:
            jurisdiction: Country/region code
            contract_type: Type of contract
            
        Returns:
            List of risk patterns
        """
        # Override in subclass if supported
        return []
    
    def validate_citation(self, citation: str) -> bool:
        """
        Validate if a citation exists and is current.
        
        Args:
            citation: Legal citation to validate
            
        Returns:
            True if valid, False otherwise
        """
        result = self.get_by_citation(citation)
        return result is not None
    
    def health_check(self) -> bool:
        """
        Check if the connector is working.
        
        Returns:
            True if healthy, False otherwise
        """
        try:
            # Attempt a simple operation to verify connectivity
            self.search("test", limit=1)
            return True
        except Exception:
            return False


# Example implementation
class ExampleConnector(BaseKnowledgeConnector):
    """Example connector implementation (not functional)."""
    
    @property
    def name(self) -> str:
        return "Example Connector"
    
    @property
    def supported_jurisdictions(self) -> List[str]:
        return ["US"]
    
    def search(self, query: str, **kwargs) -> List[Dict[str, Any]]:
        # In a real implementation, this would call an API
        return [{"title": f"Result for: {query}", "content": "..."}]
    
    def get_by_citation(self, citation: str) -> Optional[Dict[str, Any]]:
        # In a real implementation, this would look up the citation
        return {"citation": citation, "text": "...", "status": "current"}
