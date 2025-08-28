#!/bin/bash

# Define the network interface to apply QoS rules
# Replace 'eth0' with your actual network interface (e.g., wlan0, enp0s3)
IFACE="eth0"

# --- Clean up any existing rules ---
echo "==> Clearing existing TC rules on $IFACE..."
sudo tc qdisc del dev $IFACE root 2>/dev/null |

| true

# --- Create the Root Queuing Discipline ---
# We attach a root HTB qdisc to the interface. All traffic will pass through this.
# The 'default 30' means any unclassified traffic will go to class 1:30 (Best Effort).
echo "==> Creating root HTB qdisc on $IFACE..."
sudo tc qdisc add dev $IFACE root handle 1: htb default 30

# --- Create the Parent Class for Bandwidth Control ---
# This class defines the total bandwidth we are managing.
# Let's assume a total link speed of 1000mbit.
echo "==> Creating parent class for total bandwidth..."
sudo tc class add dev $IFACE parent 1: classid 1:1 htb rate 1000mbit

# --- Create QoS Classes based on the Sentinel-QoS Policy Map ---
# Each class is a child of the parent class (1:1) and is given a specific
# bandwidth rate and priority. 'prio' is the most important parameter for
# latency-sensitive traffic; lower number means higher priority.

# Class 1: High Priority (Audio/Video Calls, Gaming) - DSCP EF (46)
# Low latency, high priority. Guaranteed 200mbit, can burst to 1000mbit.
echo "==> Creating High Priority class (1:10)..."
sudo tc class add dev $IFACE parent 1:1 classid 1:10 htb rate 200mbit ceil 1000mbit prio 1

# Class 2: Medium-High Priority (Video Streaming) - DSCP AF41 (34)
# High throughput. Guaranteed 400mbit.
echo "==> Creating Video Streaming class (1:20)..."
sudo tc class add dev $IFACE parent 1:1 classid 1:20 htb rate 400mbit ceil 1000mbit prio 2

# Class 3: Best Effort (Browsing, Default) - DSCP AF21 (18) / DF (0)
# Standard priority. Guaranteed 300mbit.
echo "==> Creating Best Effort class (1:30)..."
sudo tc class add dev $IFACE parent 1:1 classid 1:30 htb rate 300mbit ceil 1000mbit prio 3

# Class 4: Low Priority (Uploads, Downloads) - DSCP AF31 (26) / CS1 (8)
# Bulk traffic. Gets what's left over. Guaranteed 100mbit.
echo "==> Creating Low Priority class (1:40)..."
sudo tc class add dev $IFACE parent 1:1 classid 1:40 htb rate 100mbit ceil 1000mbit prio 4

# --- Create Filters to Direct Traffic to Classes ---
# These filters instruct the qdisc on how to classify packets. We use the DSCP
# value in the IP header, which our AI orchestrator will set.
echo "==> Creating TC filters based on DSCP values..."
sudo tc filter add dev $IFACE protocol ip parent 1:0 prio 1 u32 match ip dscp 0x2e 0xff flowid 1:10 # EF (46) -> High Prio
sudo tc filter add dev $IFACE protocol ip parent 1:0 prio 2 u32 match ip dscp 0x22 0xff flowid 1:20 # AF41 (34) -> Video Stream
sudo tc filter add dev $IFACE protocol ip parent 1:0 prio 3 u32 match ip dscp 0x12 0xff flowid 1:30 # AF21 (18) -> Best Effort
sudo tc filter add dev $IFACE protocol ip parent 1:0 prio 4 u32 match ip dscp 0x1a 0xff flowid 1:40 # AF31 (26) -> Low Prio
sudo tc filter add dev $IFACE protocol ip parent 1:0 prio 5 u32 match ip dscp 0x08 0xff flowid 1:40 # CS1 (8) -> Low Prio

echo "==> QoS setup complete for $IFACE."