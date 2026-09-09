from typing import List
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from app.models import User
from app.auth.deps import get_current_user
from app.services.sniffer import list_network_interfaces, live_sniffer_engine

router = APIRouter(prefix="/sniffer", tags=["Live Packet Sniffer"])

class StartSnifferRequest(BaseModel):
    interface_name: str = "Default Wi-Fi / Ethernet Adapter"

class SnifferStatusResponse(BaseModel):
    is_running: bool
    active_interface: str
    total_packets_captured: int
    total_flows_created: int
    threats_detected: int

@router.get("/interfaces", response_model=List[dict])
def get_interfaces(current_user: User = Depends(get_current_user)):
    """List available network interfaces/adapters on the server"""
    return list_network_interfaces()

@router.get("/status", response_model=SnifferStatusResponse)
def get_sniffer_status(current_user: User = Depends(get_current_user)):
    """Check status and statistics of live packet sniffer"""
    return SnifferStatusResponse(
        is_running=live_sniffer_engine.is_running,
        active_interface=live_sniffer_engine.active_interface,
        total_packets_captured=live_sniffer_engine.total_packets_captured,
        total_flows_created=live_sniffer_engine.total_flows_created,
        threats_detected=live_sniffer_engine.threats_detected
    )

@router.post("/start", response_model=SnifferStatusResponse)
def start_sniffer(
    payload: StartSnifferRequest,
    current_user: User = Depends(get_current_user)
):
    """Start real-time Scapy packet capture on specified network adapter"""
    live_sniffer_engine.start(payload.interface_name)
    return get_sniffer_status(current_user=current_user)

@router.post("/stop", response_model=SnifferStatusResponse)
def stop_sniffer(current_user: User = Depends(get_current_user)):
    """Stop active packet capture engine"""
    live_sniffer_engine.stop()
    return get_sniffer_status(current_user=current_user)
