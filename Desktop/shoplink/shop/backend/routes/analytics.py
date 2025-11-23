from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import get_db
from utils import standard_response
from datetime import datetime, timedelta

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/sales', methods=['GET'])
@jwt_required()
def get_sales_analytics():
    try:
        user_id = int(get_jwt_identity())
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Get user's shops
        cursor.execute('SELECT id FROM shops WHERE owner_id = ?', (user_id,))
        shop_ids = [row['id'] for row in cursor.fetchall()]
        
        if not shop_ids:
            conn.close()
            return jsonify(standard_response('success', 'Analytics retrieved', {
                'total_sales': 0,
                'total_revenue': 0,
                'monthly_sales': [],
                'top_products': [],
                'revenue_trend': []
            })), 200
        
        shop_ids_str = ','.join(map(str, shop_ids))
        
        # Total sales and revenue
        query = f'''
            SELECT 
                COUNT(*) as total_orders,
                COALESCE(SUM(total_amount), 0) as total_revenue
            FROM orders 
            WHERE shop_id IN ({shop_ids_str}) AND status = 'completed'
        '''
        if start_date:
            query += f" AND created_at >= '{start_date}'"
        if end_date:
            query += f" AND created_at <= '{end_date}'"
        
        cursor.execute(query)
        totals = cursor.fetchone()
        
        # Monthly sales
        monthly_query = f'''
            SELECT 
                strftime('%Y-%m', created_at) as month,
                COUNT(*) as order_count,
                COALESCE(SUM(total_amount), 0) as revenue
            FROM orders 
            WHERE shop_id IN ({shop_ids_str}) AND status = 'completed'
        '''
        if start_date:
            monthly_query += f" AND created_at >= '{start_date}'"
        if end_date:
            monthly_query += f" AND created_at <= '{end_date}'"
        monthly_query += ' GROUP BY month ORDER BY month DESC LIMIT 12'
        
        cursor.execute(monthly_query)
        monthly_sales = [dict(row) for row in cursor.fetchall()]
        
        # Top selling products
        top_products_query = f'''
            SELECT 
                p.id,
                p.name,
                p.image_url,
                SUM(oi.quantity) as total_sold,
                SUM(oi.subtotal) as total_revenue
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN products p ON oi.product_id = p.id
            WHERE o.shop_id IN ({shop_ids_str}) AND o.status = 'completed'
        '''
        if start_date:
            top_products_query += f" AND o.created_at >= '{start_date}'"
        if end_date:
            top_products_query += f" AND o.created_at <= '{end_date}'"
        top_products_query += ' GROUP BY p.id ORDER BY total_sold DESC LIMIT 10'
        
        cursor.execute(top_products_query)
        top_products = [dict(row) for row in cursor.fetchall()]
        
        # Revenue trend (last 30 days)
        trend_query = f'''
            SELECT 
                DATE(created_at) as date,
                COALESCE(SUM(total_amount), 0) as revenue
            FROM orders 
            WHERE shop_id IN ({shop_ids_str}) AND status = 'completed'
        '''
        if start_date:
            trend_query += f" AND created_at >= '{start_date}'"
        else:
            trend_query += f" AND created_at >= date('now', '-30 days')"
        if end_date:
            trend_query += f" AND created_at <= '{end_date}'"
        trend_query += ' GROUP BY date ORDER BY date ASC'
        
        cursor.execute(trend_query)
        revenue_trend = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        
        return jsonify(standard_response('success', 'Sales analytics retrieved', {
            'total_sales': totals['total_orders'],
            'total_revenue': totals['total_revenue'],
            'monthly_sales': monthly_sales,
            'top_products': top_products,
            'revenue_trend': revenue_trend
        })), 200
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

@analytics_bp.route('/events', methods=['GET'])
@jwt_required()
def get_event_analytics():
    try:
        user_id = int(get_jwt_identity())
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Upcoming events
        upcoming_query = '''
            SELECT COUNT(*) as count
            FROM events 
            WHERE organizer_id = ? AND start_date > datetime('now') AND is_published = 1
        '''
        cursor.execute(upcoming_query, (user_id,))
        upcoming_count = cursor.fetchone()['count']
        
        # Completed events
        completed_query = '''
            SELECT COUNT(*) as count
            FROM events 
            WHERE organizer_id = ? AND end_date < datetime('now')
        '''
        cursor.execute(completed_query, (user_id,))
        completed_count = cursor.fetchone()['count']
        
        # Total registrations
        registrations_query = '''
            SELECT COUNT(*) as count
            FROM event_registrations er
            JOIN events e ON er.event_id = e.id
            WHERE e.organizer_id = ?
        '''
        if start_date:
            registrations_query += f" AND er.created_at >= '{start_date}'"
        if end_date:
            registrations_query += f" AND er.created_at <= '{end_date}'"
        
        cursor.execute(registrations_query, (user_id,))
        total_registrations = cursor.fetchone()['count']
        
        # Event performance
        performance_query = '''
            SELECT 
                e.id,
                e.title,
                e.start_date,
                e.end_date,
                e.registrations_count,
                e.views_count,
                e.ticket_price,
                e.is_free,
                (e.registrations_count * e.ticket_price) as revenue
            FROM events e
            WHERE e.organizer_id = ?
        '''
        if start_date:
            performance_query += f" AND e.created_at >= '{start_date}'"
        if end_date:
            performance_query += f" AND e.created_at <= '{end_date}'"
        performance_query += ' ORDER BY e.start_date DESC LIMIT 20'
        
        cursor.execute(performance_query, (user_id,))
        event_performance = [dict(row) for row in cursor.fetchall()]
        
        # Event revenue by month
        revenue_query = '''
            SELECT 
                strftime('%Y-%m', start_date) as month,
                COUNT(*) as event_count,
                SUM(registrations_count * ticket_price) as revenue
            FROM events 
            WHERE organizer_id = ? AND is_published = 1
        '''
        if start_date:
            revenue_query += f" AND start_date >= '{start_date}'"
        if end_date:
            revenue_query += f" AND start_date <= '{end_date}'"
        revenue_query += ' GROUP BY month ORDER BY month DESC LIMIT 12'
        
        cursor.execute(revenue_query, (user_id,))
        event_revenue = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        
        return jsonify(standard_response('success', 'Event analytics retrieved', {
            'upcoming_events': upcoming_count,
            'completed_events': completed_count,
            'total_registrations': total_registrations,
            'event_performance': event_performance,
            'event_revenue': event_revenue
        })), 200
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

@analytics_bp.route('/activity', methods=['GET'])
@jwt_required()
def get_activity_analytics():
    try:
        user_id = int(get_jwt_identity())
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Get user's shops
        cursor.execute('SELECT id FROM shops WHERE owner_id = ?', (user_id,))
        shop_ids = [row['id'] for row in cursor.fetchall()]
        
        # Shop views (from shop followers)
        shop_views = 0
        product_views = 0
        total_reviews = 0
        
        if shop_ids:
            shop_ids_str = ','.join(map(str, shop_ids))
            cursor.execute(f'SELECT SUM(followers_count) as total FROM shops WHERE id IN ({shop_ids_str})')
            result = cursor.fetchone()
            shop_views = result['total'] if result['total'] else 0
            
            # Product views
            cursor.execute(f'SELECT SUM(views_count) as total FROM products WHERE shop_id IN ({shop_ids_str})')
            result = cursor.fetchone()
            product_views = result['total'] if result['total'] else 0
            
            # Total reviews received
            cursor.execute(f'SELECT COUNT(*) as total FROM shop_reviews WHERE shop_id IN ({shop_ids_str})')
            total_reviews = cursor.fetchone()['total']
        
        # Engagement rate (followers / (followers + views))
        engagement_rate = 0
        if shop_views > 0:
            engagement_rate = (total_reviews / shop_views) * 100 if shop_views > 0 else 0
        
        # Recent customer interactions (reviews in last 30 days)
        recent_interactions = 0
        if shop_ids:
            shop_ids_str = ','.join(map(str, shop_ids))
            recent_interactions_query = f'''
                SELECT COUNT(*) as count
                FROM shop_reviews sr
                WHERE sr.shop_id IN ({shop_ids_str})
                AND sr.created_at >= date('now', '-30 days')
            '''
            cursor.execute(recent_interactions_query)
            recent_interactions = cursor.fetchone()['count']
        
        conn.close()
        
        return jsonify(standard_response('success', 'Activity analytics retrieved', {
            'shop_views': shop_views,
            'product_views': product_views,
            'total_reviews': total_reviews,
            'engagement_rate': round(engagement_rate, 2),
            'recent_interactions': recent_interactions
        })), 200
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

@analytics_bp.route('/alerts', methods=['GET'])
@jwt_required()
def get_alerts():
    try:
        user_id = int(get_jwt_identity())
        
        conn = get_db()
        cursor = conn.cursor()
        
        alerts = []
        
        # Get user's shops
        cursor.execute('SELECT id FROM shops WHERE owner_id = ?', (user_id,))
        shop_ids = [row['id'] for row in cursor.fetchall()]
        
        if shop_ids:
            shop_ids_str = ','.join(map(str, shop_ids))
            
            # Low stock alerts
            cursor.execute(f'''
                SELECT id, name, stock_quantity, shop_id
                FROM products 
                WHERE shop_id IN ({shop_ids_str}) 
                AND stock_quantity <= 10 
                AND stock_quantity > 0
                AND is_available = 1
                ORDER BY stock_quantity ASC
                LIMIT 10
            ''')
            low_stock = [dict(row) for row in cursor.fetchall()]
            for product in low_stock:
                alerts.append({
                    'type': 'low_stock',
                    'message': f"{product['name']} is running low (only {product['stock_quantity']} left)",
                    'product_id': product['id'],
                    'shop_id': product['shop_id']
                })
            
            # Upcoming events (next 7 days)
            cursor.execute('''
                SELECT id, title, start_date
                FROM events 
                WHERE organizer_id = ? 
                AND start_date BETWEEN datetime('now') AND datetime('now', '+7 days')
                AND is_published = 1
                ORDER BY start_date ASC
                LIMIT 10
            ''', (user_id,))
            upcoming_events = [dict(row) for row in cursor.fetchall()]
            for event in upcoming_events:
                alerts.append({
                    'type': 'upcoming_event',
                    'message': f"Event '{event['title']}' is starting soon",
                    'event_id': event['id'],
                    'start_date': event['start_date']
                })
            
            # High selling periods (check last 7 days sales)
            cursor.execute(f'''
                SELECT DATE(created_at) as date, COUNT(*) as order_count, SUM(total_amount) as revenue
                FROM orders 
                WHERE shop_id IN ({shop_ids_str}) 
                AND status = 'completed'
                AND created_at >= date('now', '-7 days')
                GROUP BY date
                HAVING order_count >= 5
                ORDER BY order_count DESC
            ''')
            high_sales = [dict(row) for row in cursor.fetchall()]
            for sale in high_sales:
                alerts.append({
                    'type': 'high_sales',
                    'message': f"High sales day: {sale['order_count']} orders, ${sale['revenue']:.2f} revenue on {sale['date']}",
                    'date': sale['date']
                })
        
        conn.close()
        
        return jsonify(standard_response('success', 'Alerts retrieved', alerts)), 200
        
    except Exception as e:
        return jsonify(standard_response('error', str(e))), 500

